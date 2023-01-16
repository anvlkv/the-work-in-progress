# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.gif">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
yarn
```

**Start TTS server**

```console
docker run -it -p 5500:5500 synesthesiam/opentts:en --cache
```

**Convert source videos**

```console
ffmpeg -i public/01/01.mov -c:v libvpx-vp9 -b:v 0.5M -r 24 -threads 0 -c:a libopus -b:a 8k public/01/01.webm

```

**Start Preview**

```console
yarn start
```

**Render video**

```console
yarn build
```

**Upgrade Remotion**

```console
yarn run upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help [on our Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Notice that for some entities a company license is needed. Read [the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
