
var LINZ=LINZ || {};

// Temporary implementation!
// Geodetic coordinate ...

//LINZ.Geodetic=require('./linz-geodetic.js')

// Coordinate types used in NZMapConv application.  Each type has functions
//
//   location=type.parse( string )
//   string=type.format( location )
//   options=type.options
//   example()
//
// Coordinate is an object containing the location defined as latitude and
// longitude in one or more datums
//
// Options is a hash (dictionary) of option values affecting the formatting
// of the data type.
//
// Coordinate types defined here are:
//    LINZ.CoordType.LatLon( coordSys )
//    LINZ.CoordType.Projection( coordSys )
//    LINZ.CoordType.NZMS260MapRef()
//    LINZ.CoordType.Topo50MapRef()
//     
// coordSys will be one of 'NZGD1949', and 'NZGD2000' for LatLon types
// coordSys will be one of 'NZMG', 'NZTM' for Projection types
//
// Example usage:
//
// ctNZGD2000=new LINZ.CoordType.LatLon('NZGD2000')
// ctNZGD1949=new LINZ.CoordType.LatLon('NZGD1949')
// ctNZMG=new LINZ.CoordType.Projection('NZMG')
// ctNZTM=new LINZ.CoordType.Projection('NZTM')
// ctNZMS260MapRef=new LINZ.CoordType.NZMS260MapRef()
// ctTopo50MapRef=new LINZ.CorodType.Topo50MapRef()
//
// location=ctNZGD2000.parse(myCoordString)
// if( location == null )
// {
//     // String is not valid
// }    
// else
// {
//     asNZGD1949=ctNZGD1949.format(location);
//     ...
// }
//

LINZ.CoordType=function()
{
    this.options={};
    this.exampleCoord=null;
}

LINZ.CoordType.prototype.setOptions=function( options )
{
    for( var key in options )
    {
        if( key in this.options )
        {
            this.options[key]=options[key];
        }
    }
}

LINZ.CoordType.prototype.example=function()
{
    return this.format(this.exampleCoord);
}


////////////////////////////////////////////////////////////////////////////////
// LINZ.CoordType.LatLon

LINZ.CoordType.LatLon=function( coordSys )
{
    LINZ.CoordType.call(this);
    this.coordSys=coordSys;
    this.options.order='EN';      // Options EN,NE
    this.options.format='DMS';    // Options DMS,DM,D
    this.options.precision=0;   // 0-9
    this.exampleCoord=new LINZ.Geodetic.Location( coordSys, [174.779104,-41.282442] );
}

LINZ.CoordType.LatLon.prototype=Object.create(LINZ.CoordType.prototype);

// Regular expressions for parsing lat/lon formats.  These only
// apply for NZ coordinates (E,S).  

// Just two numbers
LINZ.CoordType.LatLon.prototype.reDegrees0=
    /^\s*(\-?)(\d+(?:\.\d+)?)(?:\s*\,\s*|\s+)(\-?)(\d+(?:\.\d+)?)\s*$/;

// Two numbers preceeded by E,S
LINZ.CoordType.LatLon.prototype.reDegrees1=
    /^\s*([ES]\s*)(\d+(?:\.\d+)?)(?:\s*\,\s*|\s+)([ES]\s*)(\d+(?:\.\d+)?)\s*$/i;

// Two numbers followed by E,S
LINZ.CoordType.LatLon.prototype.reDegrees2=
    /^\s*(\d+(?:\.\d+)?)\s*([ES])(?:\s*\,\s*|\s+)(\d+(?:\.\d+)?)\s*([ES])\s*$/i;

// Degrees/minutes optionally preceeded by E,S
LINZ.CoordType.LatLon.prototype.reDegMins1=
    /^\s*([ES-]?)\s*(\d+)\s+([0-5]?\d(?:\.\d+)?)(?:\s*\,\s*|\s+)([ES-]?)\s*(\d+)\s+([0-5]?\d(?:\.\d+)?)\s*$/i;

// Degrees/minutes followed by E,S
LINZ.CoordType.LatLon.prototype.reDegMins2=
    /^\s*(\d+)\s+([0-5]?\d(?:\.\d+)?)\s*([ES])(?:\s*\,\s*|\s+)(\d+)\s+([0-5]?\d(?:\.\d+)?)\s*([ES])\s*$/i;

// Degrees,minutes,seconds optionally preceeded by E,S
LINZ.CoordType.LatLon.prototype.reDMS1=
    /^\s*([ES-]?\s*)(\d+)\s+([0-5]?\d)\s+([0-5]?\d(?:\.\d+)?)(?:\s*\,\s*|\s+)([ES-]?\s*)(\d+)\s+([0-5]?\d)\s+([0-5]?\d(?:\.\d+)?)\s*$/i;

// Degrees,minutes,seconds followed by E,S
LINZ.CoordType.LatLon.prototype.reDMS2=
    /^\s*(\d+)\s+([0-5]?\d)\s+([0-5]?\d(?:\.\d+)?)\s*([ES])(?:\s*\,\s*|\s+)(\d+)\s+([0-5]?\d)\s+([0-5]?\d(?:\.\d+)?)\s*([ES])\s*$/i;

// Not sure where this format comes from - but used in original NZMapConv application
LINZ.CoordType.LatLon.prototype.reCard=
    /^\s*LL2?\(\s*(1\d\d(?:\.\d+)?)\s*\,\s*(\-)(\d\d(?:\.\d+)?)\s*\)\s*$/;

LINZ.CoordType.LatLon.prototype.parse=function( coordstr )
{

    var deg1 = 0;
    var deg2 = 0;
    var hem1 = '';
    var hem2 = '';
    var type;

    var match;
    if( (match=coordstr.match(this.reDegrees0)) || (match=coordstr.match(this.reDegrees1)))
    {
        type=1;
        hem1=match[1];
        deg1=parseFloat(match[2]);
        hem2=match[3];
        deg2=parseFloat(match[4]);
    }
    else if( match=coordstr.match(this.reDegrees2) ) 
    {
        type=2;
        deg1=parseFloat(match[1]);
        hem1=match[2];
        deg2=parseFloat(match[3]);
        hem2=match[4];
    }
    else if( match=coordstr.match(this.reDegMins1) ) 
    {
        type=3;
        hem1=match[1];
        deg1=parseFloat(match[2])+parseFloat(match[3])/60.0;
        hem2=match[4];
        deg2=parseFloat(match[5])+parseFloat(match[6])/60.0;
    }
    else if( match=coordstr.match(this.reDegMins2) ) 
    {
        type=4;
        deg1=parseFloat(match[1])+parseFloat(match[2])/60.0;
        hem1=match[3];
        deg2=parseFloat(match[4])+parseFloat(match[5])/60.0;
        hem2=match[6];
    }
    else if( match=coordstr.match(this.reDMS1) ) 
    {
        type=5;
        hem1=match[1];
        deg1=parseFloat(match[2])+parseFloat(match[3])/60.0+parseFloat(match[4])/3600.0;
        hem2=match[5];
        deg2=parseFloat(match[6])+parseFloat(match[7])/60.0+parseFloat(match[8])/3600.0;
    }
    else if( match=coordstr.match(this.reDMS2) ) 
    {
        type=6;
        deg1=parseFloat(match[1])+parseFloat(match[2])/60.0+parseFloat(match[3])/3600.0;
        hem1=match[4];
        deg2=parseFloat(match[5])+parseFloat(match[6])/60.0+parseFloat(match[7])/3600.0;
        hem2=match[8];
    }
    else if( match=coordstr.match(this.reCard) ) 
    {
        type=7;
        hem1='';
        deg1=parseFloat(match[1]);
        hem2=match[2]
        deg2=parseFloat(match[3]);
    }
    else
    {
        return;
    }
    hem1 = hem1.trim().toUpperCase();
    hem2 = hem2.trim().toUpperCase();
    if( hem1 == 'S' && hem2 != 'E' ) return;
    if( hem1 == 'E' && hem2 != 'S' ) return;
    if( hem2 == 'S' && hem1 != 'E' ) return;
    if( hem2 == 'E' && hem1 != 'S' ) return;
    if( hem1.match(/[S-]/)) deg1 = -deg1;
    if( hem2.match(/[S-]/)) deg2 = -deg2;
    if( hem1 == '' && hem2 == '' )
    {
        // If no hemisphere specified assume smaller value is latitude
        // and therefore negative
        if( deg1 < deg2 ) deg1=-deg1; else deg2=-deg2;
    }
    // Lower numeric value is latitude
    if( deg1 < deg2 ) { var tmp=deg1; deg1=deg2; deg2=tmp; }

    // Check coordinate ranges
    if( deg1 < 160 || deg1 > 180 ) return;
    if( deg2 < -50 || deg2 > -30 ) return;

    return new LINZ.Geodetic.Location( this.coordSys, [deg1,deg2] );
}

LINZ.CoordType.LatLon.prototype._dms=function( ordinate )
{
    var format=this.options.format;
    var precision=parseInt(this.options.precision);
    if( format == 'D')
    {
        if( precision > 8 ) precision=8;
        return ordinate.toFixed(precision);
    }
    if( format == 'DM' )
    {
        if( precision > 6 ) precision=6;
        var mult=Math.pow(10,precision)*60;
        ordinate=ordinate*mult;
        ordinate=Math.round(ordinate)/mult;
        var deg=Math.floor(ordinate);
        var min=(ordinate-deg)*60;
        min = min.toFixed(precision);
        var nd = min.indexOf('.')
        if (nd < 0) nd = min.length;
        min = '00'.substr(nd) + min;        
        return deg.toString()+' '+min;
    }

    if( precision > 4 ) precision=4;
    var mult=Math.pow(10,precision)*3600;
    ordinate=ordinate*mult;
    ordinate=Math.round(ordinate)/mult;
    var deg=Math.floor(ordinate);
    var sec=(ordinate-deg)*60;
    var min=Math.floor(sec);
    min=min.toString();
    if( min.length < 2 ) min='0'+min;
    var sec=(sec-min)*60;
    sec = sec.toFixed(precision);
    var nd = sec.indexOf('.')
    if (nd < 0) nd = sec.length;
    sec = '00'.substr(nd) + sec;
    return deg.toString()+' '+min+' '+sec;
}

LINZ.CoordType.LatLon.prototype.format=function( location )
{
    var coordinates=location.as(this.coordSys);
    var ecrd=coordinates[0];
    var ncrd=coordinates[1];
    var epoint='E';
    var npoint='N';
    if( ecrd < 0 ){ ecrd=-ecrd; epoint='W'; }
    if( ncrd < 0 ){ ncrd=-ncrd; npoint='S'; }
    ecrd=this._dms(ecrd);
    ncrd=this._dms(ncrd);
    if( this.options.order == 'EN' )
    {
        return ecrd+' '+epoint+' '+ncrd+' '+npoint;
    }
    else
    {
        return ncrd+' '+npoint+' '+ecrd+' '+epoint;
    }
}

////////////////////////////////////////////////////////////////////////////////
// LINZ.CoordType.Projection

LINZ.CoordType.Projection=function( coordSys )
{
    LINZ.CoordType.call(this);
    this.coordSys=coordSys;
    this.options.order='EN';      // Options EN, NE
    this.options.precision=0;   // 0-3
    // Will need to change this if we make coordSys more intelligent!
    if( this.coordSys == 'NZTM' )
    {
        this.exampleCoord=new LINZ.Geodetic.Location( coordSys, [1748798.071,5428003.627] );
    }
    else
    {
        this.exampleCoord=new LINZ.Geodetic.Location( coordSys, [2659081.071,5989747.627] );
    }
}

LINZ.CoordType.Projection.prototype=Object.create(LINZ.CoordType.prototype);

LINZ.CoordType.Projection.prototype.reProj1=
   /^\s*(\d{7}(?:\.\d+)?)(?:\s*M?([EN]))?(?:\s*\,\s*|\s+)(\d{7}(?:\.\d+)?)(?:\s*M?([EN]))?\s*$/i;

LINZ.CoordType.Projection.prototype.reProj2=
   /^\s*([EN]\s*)(\d{7}(?:\.\d+)?)(?:\s*\,\s*|\s+)([EN]\s*)(\d{7}(?:\.\d+)?)\s*$/;

LINZ.CoordType.Projection.prototype.reCard=
    /^\s*EN2?\(\s*(\d{7}(?:\.\d+)?)\s*\,\s*(\d{7}(?:\.\d+)?)\s*\)\s*$/;


LINZ.CoordType.Projection.prototype.parse=function( coordstr )
{
    var match;
    var ord1, ord2, axis1, axis2;
    if( match=coordstr.match(this.reProj1))
    {
        ord1=parseFloat(match[1]);
        axis1=match[2] || '';
        ord2=parseFloat(match[3]);
        axis2=match[4] || '';
        if( axis1=='' && axis2=='')
        {
            if( ord1 < ord2 ) {axis1='E'; axis2='N';}
            else { axis1='N'; axis2='E';}
        }
    }
    else if( match=coordstr.match(this.reProj2))
    {
        axis1=match[1] || '';
        ord1=parseFloat(match[2]);
        axis2=match[3] || '';
        ord2=parseFloat(match[4]);
    }
    else if( match=coordstr.match(this.reCard))
    {
        axis1='E';
        axis2='N'
        ord1=parseFloat(match[1]);
        ord2=parseFloat(match[2]);
    }
    else {
        return;
    }

    if( axis1 == 'E' && axis2 != 'N' ) return;
    if( axis1 == 'N' && axis2 != 'E' ) return;
    if( axis1 == 'N' ){ var tmp=ord1; ord1=ord2; ord2=tmp; }
    return new LINZ.Geodetic.Location( this.coordSys, [ord1,ord2] );
}

LINZ.CoordType.Projection.prototype.format=function( location )
{

    var coordinates=location.as(this.coordSys);
    var precision=parseInt(this.options.precision);
    if( precision > 3 ) precision=3;
    var ecrd=coordinates[0].toFixed(this.options.precision)+' mE';
    var ncrd=coordinates[1].toFixed(this.options.precision)+' mN';
    if( this.options.order == 'NE' )
    {
        return ncrd + ' ' + ecrd;
    }
    else
    {
        return ecrd + ' ' + ncrd;
    }
}

////////////////////////////////////////////////////////////////////////////////
// LINZ.CoordType.MapRef

LINZ.CoordType.MapRef=function()
{
    LINZ.CoordType.call(this);
    this.options.digits='6';   // Options 6 or 8
    this.mapLetters=[];
    this.mapNumbers=[];
    this.letterIsEast=false;
    this.mapOriginE=0;
    this.mapOriginN=0;
    this.mapSizeE=40000.0;
    this.mapSizeN=40000.0;
    this.coordSys='';
}

LINZ.CoordType.MapRef.prototype=Object.create(LINZ.CoordType.prototype);

LINZ.CoordType.MapRef.prototype.mapRefRegex=
    /^\s*([A-Z]{1,2})(\d\d)\s*(?:(\d\d)\s*(\d\d)|(\d\d\d)\s*(\d\d\d)|(\d\d\d\d)\s*(\d\d\d\d))\s*$/;

LINZ.CoordType.MapRef.prototype.parse=function( mapref )
{
    var result=mapref.toUpperCase().match(this.mapRefRegex);
    if( ! result ) return;

    var mapletter=result[1];
    var mapnumber=result[2];
    var mape=0.0;
    var mapn=0.0;
    if( result[3] )
    {
        mape=parseFloat(result[3])*1000.0;
        mapn=parseFloat(result[4])*1000.0;
    }
    else if( result[5] )
    {
        mape=parseFloat(result[5])*100.0;
        mapn=parseFloat(result[6])*100.0;
    }
    else if( result[7] )
    {
        mape=parseFloat(result[7])*10.0;
        mapn=parseFloat(result[8])*10.0;
    }

    var letterIndex=this.mapLetters.indexOf(mapletter);
    if( letterIndex < 0 ) return;
    var numberIndex=this.mapNumbers.indexOf(mapnumber);
    if( numberIndex < 0 ) return;
    if( this.letterIsEast ){ var tmp=letterIndex; letterIndex=numberIndex; numberIndex=tmp; }

    var mapCentreE=this.mapOriginE+(numberIndex+0.5)*this.mapSizeE;
    var mapCentreN=this.mapOriginN-(letterIndex+0.5)*this.mapSizeN;

    mape=mape+Math.round((mapCentreE-mape)/100000.0)*100000.0;
    mapn=mapn+Math.round((mapCentreN-mapn)/100000.0)*100000.0;

    return new LINZ.Geodetic.Location( this.coordSys, [mape,mapn] );
}

LINZ.CoordType.MapRef.prototype.format=function( location )
{
    var coordinates = location.as(this.coordSys);
    if (coordinates === undefined) return;
    var mape=coordinates[0];
    var mapn=coordinates[1];

    var letterIndex=Math.floor((this.mapOriginN-mapn)/this.mapSizeN);
    var numberIndex=Math.floor((mape-this.mapOriginE)/this.mapSizeE);
    if( this.letterIsEast ){ var tmp=letterIndex; letterIndex=numberIndex; numberIndex=tmp; }

    if( letterIndex < 0 || letterIndex >= this.mapLetters.length ) return '';
    var mapletters=this.mapLetters[letterIndex];

    if( numberIndex < 0 || numberIndex >= this.mapNumbers.length ) return '';
    var mapnumbers=this.mapNumbers[numberIndex];

    var ndigit=3;
    if( this.options.digits == '8' )
    {
        mape /= 10.0;
        mapn /= 10.0;
        ndigit=4;
    }
    else
    {
        mape /= 100.0;
        mapn /= 100.0;
    }
    mapn=Math.round(mapn).toString();
    mapn=mapn.substr(mapn.length-ndigit);
    mape=Math.round(mape).toString();
    mape=mape.substr(mape.length-ndigit);

    return mapletters+mapnumbers+' '+mape+' '+mapn;
}

////////////////////////////////////////////////////////////////////////////////
// LINZ.CoordType.NZMS260MapRef

LINZ.CoordType.NZMS260MapRef=function()
{
    LINZ.CoordType.MapRef.call(this);
    this.mapLetters=[
        'A','B','C','D','E','F','G','H','I','J','K','L','M',
        'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
        ];
    this.mapNumbers=[
        '01','02','03','04','05','06','07','08','09',
        '10','11','12','13','14','15','16','17','18','19',
        '20','21','22','23','24','25','26','27','28','29',
        '30','31','32','33','34','35','36','37','38','39',
        '40','41','42','43','44','45','46','47','48','49',
        '50'
        ];
    this.letterIsEast=true;
    this.mapOriginE=1970000.0;
    this.mapOriginN=6790000.0;
    this.mapSizeE=40000.0;
    this.mapSizeN=30000.0;
    this.coordSys='NZMG';
    this.exampleCoord=new LINZ.Geodetic.Location( this.coordSys, [2659081.071,5989747.627] );
}

LINZ.CoordType.NZMS260MapRef.prototype=Object.create(LINZ.CoordType.MapRef.prototype);

////////////////////////////////////////////////////////////////////////////////
// LINZ.CoordType.Topo50MapRef

LINZ.CoordType.Topo50MapRef=function()
{
    LINZ.CoordType.MapRef.call(this);
    this.mapLetters=[
        'AS','AT','AU','AV','AW','AX','AY','AZ','BA','BB','BC','BD','BE','BF','BG',
        'BH','BJ','BK','BL','BM','BN','BP','BQ','BR','BS','BT','BU','BV','BW','BX',
        'BY','BZ','CA','CB','CC','CD','CE','CF','CG','CH','CJ','CK'];
    this.mapNumbers=[
        '04','05','06','07','08','09',
        '10','11','12','13','14','15','16','17','18','19',
        '20','21','22','23','24','25','26','27','28','29',
        '30','31','32','33','34','35','36','37','38','39',
        '40','41','42','43','44','45'
        ];
    this.letterIsEast=false;
    this.mapOriginE=1084000.0;
    this.mapOriginN=6234000.0;
    this.mapSizeE=24000.0;
    this.mapSizeN=36000.0;
    this.coordSys='NZTM';
    this.exampleCoord=new LINZ.Geodetic.Location( this.coordSys, [1748798.071,5428003.627] );
}

LINZ.CoordType.Topo50MapRef.prototype=Object.create(LINZ.CoordType.MapRef.prototype);

///////////////////////////////////////////////////////////////////////////

//module.exports=LINZ.CoordType;
