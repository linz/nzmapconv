
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

/^\s*([0-6]?\d)([$lat_bands])\s*([$col_ms])([$row_ms])(?:\s*(\d{2,10}|\d{1,5}\s+\d{1,5}))?\s*$/xi
    

LINZ.CoordType.MapRef.prototype.parse=function( mapref )
{
    var result=mapref.toUpperCase().match(this.mapRefRegex);
    if( ! result ) return;

    my ($zone,$band,$ems,$nms,$digits)=($1,$2,$3,$4,$5);

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
    var coordinates=location.as(this.coordSys);
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
use vars qw/$lat_bands $row_ms $col_ms $nrow_ms $ncol_ms $ms $msband %utmproj/;

$lat_bands='CDEFGHJKLMNPQRSTUVWX';
$row_ms='ABCDEFGHJKLMNPQRSTUV';
$nrow_ms=length($row_ms);
$col_ms='ABCDEFGHJKLMNPQRSTUVWXYZ';
$ncol_ms=length($col_ms);
$ms=100000.0;
$msband=$ms*$nrow_ms;
%utmproj=();

sub gzd {
    my ($lon,$lat) = @_;
    die sprintf("Invalid latitude %.5f for MGRS\n",$lat) if $lat < -80.0 || $lat > 84.0;
    my $lb=int(($lat+80)/8.0);
    $lb=20 if $lb > 20;
    $lb=0 if $lb < 0;
    my $band=substr($lat_bands,$lb,1);
    $lon += 180;
    $lon += 360 while $lon < 0;
    my $zone=int($lon/6.0)+1;
    $zone -= 60 while $zone > 60;
    return $zone,$band;
    }

sub utmproj {
    my($zone,$band)=@_;
    my $zb=$zone.$band;
    return $utmproj{$zb} if exists $utmproj{$zb};
    if( ! exists $utmproj{$zb} )
    {
        my $cm=$zone*6.0-183.0;
        my $fn= $band lt 'N' ? 10000000.0 : 0.0;
        $utmproj{$zb} = new LINZ::Geodetic::TMProjection(GRS80,$cm,0.0,0.9996,500000.0,$fn,1.0);
    }
    return $utmproj{$zb};
    }

sub write {
    my($lat,$lon,$ndg)=@_;
    $ndg=5 if $ndg eq '';
    my($zone,$band)=gzd($lon,$lat);
    my $proj=utmproj($zone,$band);
    my ($n,$e)=@{$proj->proj([$lat,$lon])};
    my $ems0=(($zone-1) % 3)*8-1;
    $e /= $ms;
    my $ems=floor($e);
    $e -= $ems;
    $ems=substr($col_ms,($ems+$ems0) % $ncol_ms, 1 );
    $n /= $ms;
    my $nms=floor($n);
    $n -= $nms;
    $nms += 5 if $zone % 2 == 0;
    $nms=substr($row_ms,int($nms) % $nrow_ms,1);
    my $dig='';
    if( $ndg > 0 )
    {
        $ndg=int($ndg);
        $ndg=5 if $ndg > 5;
        my $factor=10**$ndg;
        $dig=sprintf(" %0*d %0*d",$ndg,$e*$factor,$ndg,$n*$factor);
    }
    return $zone.$band.' '.$ems.$nms.$dig;
    }

sub read {
    my($gridref)=@_;
    $gridref=uc($gridref);
    my $valid = $gridref =~ /^\s*
            ([0-6]?\d)([$lat_bands])\s*
            ([$col_ms])([$row_ms])
            (?:\s*(\d{2,10}|\d{1,5}\s+\d{1,5}))?
            \s*$/xi;
    my ($zone,$band,$ems,$nms,$digits)=($1,$2,$3,$4,$5);
    my ($de,$dn)=split(' ',$digits);
    if( $dn eq '' )
    {
        $valid=0 if length($de) % 2 == 1;
        $dn=substr($de,length($de)/2);
        $de=substr($de,0,length($de)/2);
    }
    elsif( length($de) != length($dn) )
    {
        $valid=0;
    }
    $valid=0 if $zone < 1 || $zone > 60;
    die "Invalid MGRS grid reference $gridref\n" if ! $valid;
    my $ndg=length($de);
    my $factor=10**(5-$ndg);
    $de = ($de+0.5)*$factor;
    $dn = ($dn+0.5)*$factor;
    my $proj=utmproj($zone,$band);
    my $cm=$zone*6.0-183.0;
    my $zlat=-76.0+index($lat_bands,uc($band))*8.0;
    # Centre of UTM zone/band.
    my $e0 = 500000.0;
    my $n0=$proj->proj([$zlat,$cm])->[0];
    my $ems0=(($zone-1) % 3)*8-1;
    my $e=(index($col_ms,uc($ems))-$ems0)*100000.0+$de;
    my $n=(index($row_ms,uc($nms))-($zone % 2 == 0 ? 5 : 0))*100000.0+$dn;
    $n += floor(($n0-$n)/$msband+0.5)*$msband;
    my $llh=$proj->geog([$n,$e]);
    return @$llh;
}
