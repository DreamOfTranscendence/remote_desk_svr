# remote_desk_svr
Remote Desktop Server with webclient, GUI remote access anywhere with a web browser

This is a nodejs app.

index.js is only for server side. It is the server.

Other .js files are for both client and server side use

Used a "magic number" file signature "Ark12k" for the .a12k file,
exactly 6 octets long, must remove the 1st 6 octets from the file
before loading the encryption key into the script.
(Unless of course in your own implementation you used a different encryption key storage method)


 I M P O R T A I N T:

This is an unfinished project, currently only the Mouse on client device functionality is at all working, and it only works in Firefox browser clients and Not on iOS devices.

Currently I believe the server will only work on Most Linux distros, probably no Mac or Windows but you can try.

Recommended debugging method:

Run nodejs console in the repo main directory, enter 'require("./index.js");' to start the server, interact with and modify global vars and functions that give you bugs
