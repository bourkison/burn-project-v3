# Burn Project
https://burn-project.herokuapp.com/

## Introduction
Burn Project is a social network that allows users to create, follow, like, comment and share exercises and workout templates among each other. Users can then track their own workouts, and chart their improvements/workout progress. Users can choose to share this progress with their peers, or alternatively keep their profile private.

The website was designed to combat exorbitant fees charged by personal trainers and workout apps, by crowdsourcing exercise/workout information thus keeping the site completely free of charge. In doing so, this keeps health and fitness inclusive and available for all people of all socioeconomic backgrounds.

The site uses the below technologies:
* Vue.js / Nuxt.js
* Typescript
* Amazon Web Services (Amplify)


## TODO
### General
* Mobile CSS
* Sort by: Like Count, Date, Followed, Used Amount
* On workout finish, increment counter on Exercise and Template
* Popper broken over canvas element

### Video
* ~~Autopause video when out of view~~
* Add a "Media Loaded" Variable to see if video still processing
* Video signature use cookies (as current method doesnt work on iOS) | https://github.com/awslabs/amplify-video/issues/323
* Cleaner Video Style

### Messages
* Everything

### Notifications
* Everything

### Charts
* ~~Timezone support~~
* ~~ORM is adding all when interval is not day~~
* Add new cards

### Post
* Post Edit, Delete
* ~~Redesign Post New (icons, etc)~~
* ~~Add mention functionality~~

### Comments/Likes
* Move the awaits into an array of promises to speed up process.
* Add mention functionality
* Comment edit

### Workouts
* Add alarm sound on timer end

### Schema
* References have removed all timestamps. Ensure they are being set on creation.

## Reference 

### API Auth
* https://github.com/aws-amplify/amplify-cli/issues/3390#issuecomment-924478950
