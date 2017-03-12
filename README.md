nzmapconv
=========

This repository contains javascript code for conversions between the main New Zealand horizontal
coordinate systems, as well as a replacement for the nzmapconv desktop application which is 
no longer supported by Land Information New Zealand (LINZ).

This includes code for converting between the NZGD2000 and NZGD49 geodetic datums and the commonest
projection coordinate systems based on them.  It does not provide conversions to other datums such as 
WGS84, or ITRF based datums.  These conversions include large grid based components and are dependent 
on the time at which the conversion is required.  This also does not provide for any conversions of 
between vertical datums.

Note that the term "WGS84 coordinates" is commonly used to mean latitude/longitude coordinates 
as distinct from projection coordinates such as New Zealand Transverse Mercator (NZTM) coordinates
in terms of easting and northing.  Coordinates described as WGS84 coordinates may not be strictly 
in terms of the WGS84 geodetic datum.  Indeed most New Zealand maps and geographic data are in terms
of NZGD2000.  Treating true WGS84 coordinates as if they were NZGD2000 coordinate will result in 
position errors of no more than 1 metre.

For more information on New Zealand coordinate systems and LINZ tools for coordinate conversions see
http://www.linz.govt.nz/data/geodetic-system/datums-projections-and-heights/understanding-datums-and-projections

# Coordinate conversion API

The coordinate conversion API is provided by three javascript files

linz-geodetic.js
linz-coordtype.js
nzgd2kgrid9911.js

## class LINZ.Geodetic.Location

A LINZ.Geodetic.Location object represents a physical location
that may be represented as coordinates in a number of coordinate systems.  
A location is defined by specifying a coordinate system and the coordinates in that system.  

Coordinate systems are defined by a code such as 'NZGD2000', 'NZTM'. Coordinates are defined 
as arrays of ordinates, either [longitude,latitude] or [easting,northing].  The corresponding 
coordinate in other coordinate systems are then obtained from the location using the .as method
which returns the coordinate as an array..

For example:

    var location=new LINZ.Geodetic.Location('NZGD2000',[173.125,-42.816]);
    var nzgd2000=location.as('NZGD2000');
    var nztm=location.as('NZTM')
    var easting=nztm[0]

## class LINZ.Geodetic.CoordType

The LINZ.Geodetic.CoordType class handles formatting and parsing coordinates represented as strings.
This includes conversion between degrees/minutes/seconds formats and decimal degrees, as well as 
conversions from NZTopo50 and NZMS206 map reference formats.

Each coordinate type exposes the following functions

    location=type.parse( string )
    string=type.format( location )
    options=type.options
    example()

Options is a hash (dictionary) of option values affecting the formatting
of the data type.

Coordinate types defined here are:

    LINZ.CoordType.LatLon( coordsys )
    LINZ.CoordType.Projection( coordsys )
    LINZ.CoordType.NZMS260MapRef()
    LINZ.CoordType.Topo50MapRef()

coordsys is a coordinate system code.  Currently supported values are 
'NZGD1949', and 'NZGD2000' for latitude/longitude types, and 
'NZMG', 'NZTM' for projection types

Example usage:

    var ctNZGD2000=new LINZ.CoordType.LatLon('NZGD2000');
    var ctNZGD1949=new LINZ.CoordType.LatLon('NZGD1949');
    var ctNZMG=new LINZ.CoordType.Projection('NZMG');
    var ctNZTM=new LINZ.CoordType.Projection('NZTM');
    var ctNZMS260MapRef=new LINZ.CoordType.NZMS260MapRef();
    var ctTopo50MapRef=new LINZ.CorodType.Topo50MapRef();

    var location=ctNZGD2000.parse(myCoordString);
    if( location == null )
    {
    // String is not valid
    }    
    else
    {
        asNZGD1949=ctNZGD1949.format(location);
        ...
    }


nzmapconv application
=====================

The nzmapconv application is provided by index.html web page.  The application includes all the files
in the www directory, with help information from the www/help information.  This can be hosted on a 
web server or opened directly from the file system by a browser.


