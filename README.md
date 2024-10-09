<img align="center" height="50px" src="/public/logo-alt.png" />
<h1 align="center">SlopToob</h1>
<p align="center">
SlopToob is a dynamic web app that provides the ability to host a 24/7 video stream of all your local videos. It also includes many features like live chat, vote skipping, and themes, while providing administrators with versatile control over playlists, file management, stream settings, and much more.
<br /><br />
The app is meant for use in private groups, with a no-account system, using a single password for all users, and a separate one for admins. See below for full list of features and setup instructions.
</p>

## Current Features

- [x] 24/7 HLS stream capability, supports all common video file types
- [x] Full comprehensive Admin Panel GUI
- [x] Stream & queue controls (play, pause, skip, seek, etc)
- [x] Ability to create multiple 'playlists' with file picker GUI
- [x] Bumper customization (Mini videos/ads that play between main videos)
- [x] Highly configurable settings for transcoding, caching, chat, display elements, and more
- [x] Password protected stream with full JWT authentication
- [x] Ability to schedule automatic playlist changes
- [x] Vote skipping
- [x] Live chat
- [x] Video history list & smart shuffle
- [x] Joke themes / effects
- [x] Good desktop & mobile website experience

## Planned Features:

- [ ] Support for other media sources (YouTube & other video streams)
- [ ] Mode for allowing normal users to vote for playlist changes, adding their own video to queue, and more

## Setup

To get the application running on a server, follow the steps below.

1. Install [Node.js](https://nodejs.org/en) >= v20
2. Download the source code either manually, or with `git clone https://github.com/Voy7/SlopToob.git`.
3. Create a `.env` file in the root of the project, this will hold some important options. You can copy the `.env.example` file, which has all the variables listed for you.
4. For the first time, you must `npm run build` in the root of the project.
5. Then run `npm start` to start the app!

## Technical Details

Technologies used:

- Full stack written in TypeScript, with ability to share common functions & types.
- Using React with Next.js for UI.
- Using TailwindCSS for styling.
- Using socket.io for web socket communication
- Using ffmpeg for transcoding
- Using HLS standards

Scripts:

- `npm run build`
- `npm run start`
- `npm run dev`
- `npm run lint`
