var nzmapconv = nzmapconv || {};
var LINZ=LINZ || {};

nzmapconv.Config=function()
{
}

nzmapconv.Config.config={
       shownzgd2000:true,
       shownzgd1949:true,
       showlatlon:true,
       latlonformat:'DMS',
       latlonorder:'EN',
       latlonprecision:0,
       showprojct:true,
       projctorder:'EN',
       projctprecision:0,
       showmapref:true,
       maprefdigits:'6'
       };

nzmapconv.Config.cookieName='nzmapconv.config';

/* JSON.stringify(..)
 * JSON.parse(..)
 * Cookies.set('name','value',{expires:9999})
 * Cookies.get('name')
 * 
 * jQuery( 'input[name=date]:checked' ).val()
 *$("input[name=mygroup][value=" + value + "]").attr('checked', 'checked');
 * parseInt (returns Nan if not integer)
 */

nzmapconv.Config.save=function()
{
    var config=nzmapconv.Config.config;
    Cookies.set(this.cookieName,JSON.stringify(config),{expires:Infinity});
}

nzmapconv.Config.reload=function()
{
    var config=nzmapconv.Config.config;
    try
    {
        var cookie=Cookies.get(this.cookieName);
        if( cookie === undefined ) return;
        var cookieval=JSON.parse(cookie);
        for( var key in config )
        {
            if( key in cookieval )
            {
                config[key]=cookieval[key];
            }
        }
    }
    catch( e )
    {
    }
}

nzmapconv.Config.loadForm=function()
{
    var config=nzmapconv.Config.config;
    for( var key in config )
    {
        var sel='input[name='+key+']';
        if( key.substr(0,4) == 'show' )
        {
            $(sel).prop('checked',config[key] );
        }
        else if( key.substr(-9,9) == 'precision' )
        {
            $(sel).val(config[key].toString());
        }
        else
        {
            $(sel+'[value=' + config[key] + ']').prop('checked', true);
        }
    }
}

nzmapconv.Config.readForm=function()
{
    var config=nzmapconv.Config.config;
    for( var key in config )
    {
        var sel='input[name='+key+']';
        if( key.substr(0,4) == 'show' )
        {
            config[key]=$(sel).prop('checked');
        }
        else if( key.substr(-9,9) == 'precision' )
        {
            var value=parseInt($(sel).val());
            if( isNaN(value) ) throw key + " must be an integer";
            if( value < 0 || value > 9 ) throw key + " must be between 0 and 9";
            config[key]=value;
        }
        else
        {
            config[key]=$(sel+':checked').val();
        }
    }
}

nzmapconv.Config.apply=function()
{
    var config=nzmapconv.Config.config;
    for( var key in config )
    {
        if( key.substr(0,4) == 'show' ) $('.'+key.substr(4)).show();
    }
    var options={};
    for( var key in config )
    {
        if( key.substr(0,4) == 'show' )
        {
            if( ! config[key] )
            {
                $('.'+key.substr(4)).hide();
            }
        }
        else
        {
            var crdtype=key.substr(0,6);
            var crdopt=key.substr(6);
            if( !(crdtype in options) ) options[crdtype]={};
            options[crdtype][crdopt]=config[key];
        }
    }
    for( var crdtype in options )
    {
        nzmapconv.CoordEntry.applyToClass( crdtype, function( field )
                {
                   field.setCoordOptions(options[crdtype]); 
                });
    }
    nzmapconv.CoordEntry.reloadOptions();
}

nzmapconv.showConverter=function()
{
    $('div.configuration').hide();
    $('div.converter').show();
}

nzmapconv.showConfiguration=function()
{
    nzmapconv.Config.loadForm();
    $('div.converter').hide();
    $('div.configuration').show();
}

nzmapconv.updateConfiguration=function()
{
    nzmapconv.Config.readForm();
    nzmapconv.Config.apply();
    nzmapconv.Config.save();
    nzmapconv.showConverter();
}

////////////////////////////////////////////////////////////////////////////

nzmapconv.history=[];
nzmapconv.historyPointer=-1;

nzmapconv.haveNext=function()
{
    return nzmapconv.historyPointer < nzmapconv.history.length-1;
}

nzmapconv.havePrev=function()
{
    return nzmapconv.historyPointer > 0;
}

nzmapconv.currentEntry=function()
{
    if( nzmapconv.history.length == 0 ) return null;
    return nzmapconv.history[nzmapconv.historyPointer];
}

nzmapconv.showPrev=function()
{
    if( nzmapconv.havePrev())
    {
        nzmapconv.historyPointer--;
        var entry=nzmapconv.currentEntry();
        entry.field.setText(entry.text);
        nzmapconv.setButtonStates();
    }
}

nzmapconv.showNext=function()
{
    if( nzmapconv.haveNext())
    {
        nzmapconv.historyPointer++;
        var entry=nzmapconv.currentEntry();
        entry.field.setText(entry.text);
        nzmapconv.setButtonStates();
    }
}

nzmapconv.addToHistory=function( entryField )
{
    entry={field:entryField, text:entryField.text()};
    currEntry = nzmapconv.currentEntry();
    if( currEntry != null && currEntry.field==entry.Field && currEntry.text==entry.text ) return;
    nzmapconv.historyPointer=nzmapconv.history.length-1;
    currEntry = nzmapconv.currentEntry();
    if( currEntry != null && currEntry.field==entry.Field && currEntry.text==entry.text ) return;
    nzmapconv.historyPointer++;
    nzmapconv.history.push(entry);
    nzmapconv.setButtonStates();
}

nzmapconv.setButtonStates=function()
{
    $("#showprev").prop('disabled',! nzmapconv.havePrev());
    $("#shownext").prop('disabled',! nzmapconv.haveNext());
}


nzmapconv.setup = function () {

    nzmapconv.setButtonStates();

    // $('input.coord-entry').each(function () { new nzmapconv.CoordEntry($(this)) });

    nzmapconv.CoordEntry.fieldConverted = nzmapconv.addToHistory;


    $("#doconfig").click( nzmapconv.showConfiguration);
    $("#cancelconfig").click(nzmapconv.showConverter);
    $("#saveconfig").click(nzmapconv.updateConfiguration);
    $("#showprev").click(nzmapconv.showPrev);
    $("#shownext").click(nzmapconv.showNext);
    $("#showhelp").click(function(){ window.location.href="help/index.html";});

    //nzmapconv.Config.reload();
    //zmapconv.Config.apply();
    
    $('.nojs').hide();
    $('.needjs').show();
}

$(document).ready(nzmapconv.setup);
