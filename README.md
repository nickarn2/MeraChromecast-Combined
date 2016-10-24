# Chromecast TV Casting HTML5 App
This static web app is a Chromecast receiver app created and maintained by MERA. SNCR gets notified when MERA has updates ready for testing and release to production.

## Update this repository
This codebase is currently separate from the MERA codebase. The update process is simple so no automation has been built to update the SNCR codebase.

### Update procedure
1. Pull latest code from the MERA repository (git@gitlab.ma.merann.ru:Verizon/GCastTV.git)
2. Update this repository with the changes from the MERA repository
3. Update the `VERSION` variable in the `vars.txt` to match the `version:` property in js/config.js. The `version:` property should be incremented by MERA however, that is sometimes missed
4. Commit and push changes as normal
5. Create a tag, e.g. `git tag -a 1.9.5.20161019.1 -m"version 1.9.5"`
6. Push the tag to the server, e.g. `git push origin 1.9.5.20161019.1`

## Build Process
Since Chromecast HTML5 app is a static web app, there is no notion of a 'build', i.e. compile and package. The build script basically packages the HTML5 app files into a versioned archive and uploads the archive to a Nexus repo. The server team will download the archive and depoy it to production.

### Buld procedure
1. Pull the latest from the `master` branch or, check out the desired tag
2. Verify the `VERSION` variable in the `vars.txt` matches the `version:` property in js/config.js
3. Execute `./build.sh` in the root directory
4. An archive (e.g. chromecast-1.0.0.tar.gz) is created in the `build/` directory and it contains the web app files in a specific directory structure as required by the server team. The `build/smarttv/` directory is the source copied from the repo that excludes hidden files/directories, build scripts and other  files that are not required by the web app.
 
(optional) pass a -u option `./build.sh -u` to upload the archive to Nexus after the build completes. This will only be used by the Bamboo job.

## Nexus
The Chromecast HTML5 app archive is in the CTS Releases repository groupId: com.synchronoss.verizon.cloud & artifactId: chromecast.

http://mavenrepo.synchronoss.net:8081/nexus/#view-repositories;cts-releases~browseindex