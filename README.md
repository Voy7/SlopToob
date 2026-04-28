<p align="center">
  <img height="150px" src="src/client/public/logo-alt.png" />
</p>
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

### Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

1. Clone the repo: `git clone https://github.com/Voy7/SlopToob.git`
2. Copy `.env.example` to `.env` and fill in your values.
3. Set `HOST_VIDEOS_PATH` in `.env` to the path of your video library on the host machine.
4. Run `docker compose up --build -d`

The app will be available at the `SERVER_URL` you configured. The database, transcoded files, and thumbnails are stored in a named Docker volume (`sloptoob-output`) so they persist across restarts and rebuilds.

### Manual

Requires [Node.js](https://nodejs.org/en) >= v20.

1. Clone the repo: `git clone https://github.com/Voy7/SlopToob.git`
2. Copy `.env.example` to `.env` and fill in your values.
3. Run `npm run build` to build the Next.js client.
4. Run `npm start` to start the app.

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
