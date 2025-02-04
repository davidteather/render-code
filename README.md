# render-code
Turn Markdown into animated programming tutorials using remotion.


[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white&style=flat-square)](https://www.linkedin.com/in/davidteather/) [![Sponsor Me](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub)](https://github.com/sponsors/davidteather) [![GitHub release (latest by date)](https://img.shields.io/github/v/release/davidteather/render-code)](https://github.com/davidteather/render-code/releases) [![GitHub](https://img.shields.io/github/license/davidteather/render-code)](https://github.com/davidteather/render-code/blob/main/LICENSE) ![](https://visitor-badge.laobi.icu/badge?page_id=davidteather.render-code) [![Support Server](https://img.shields.io/discord/783108952111579166.svg?color=7289da&logo=discord&style=flat-square)](https://discord.gg/yyPhbfma6f)

🚩 - **warning** this project is still in alpha, you probably shouldn't use this with unsaved premiere pro projects or anything high risk.

## Context

I create some coding tutorials on my [youtube channel](https://www.youtube.com/@DavidTeatherCodes) and it's always annoying to make [fireship io](https://www.youtube.com/@Fireship) inspired coding tutorials. The traditional way that he's done it and I've done it is by putting your entire code block into vs code, "frame by frame" doing a control + z to get them all to instantly appear and be highlighted. This sucks especially if you realize in editing a variable name is spelled wrong.

I've created this to easily convert a markdown file representing this tutorial -> remotion -> premiere pro automations.

## Setup

* `python -m pip install -r requirements.txt`
    * Follow [pymiere's installation guide](https://github.com/qmasingarbe/pymiere) for automating premiere pro actions
    * Install [ffmpeg](https://ffmpeg.org/) to render video

## Usage

1. Define a markdown file see examples in [examples/basic.md](./examples/basic.md), the basic idea is each code block is a "segment"/frame
2. `python main.py render examples/basic.md`
3. Open up premiere pro with a new project, create a sequence
4. `python main.py export examples/basic.md`

## Output Examples

### Remotion Output 

Check out the example mp4 [here](./examples/basic/out/MyComp.mp4) or on [youtube](https://youtu.be/6bZJ1EI8RjA)

### Premiere Pro Output

We cut around the frames so you can easily re-size it do whatever your voice over duration ends up being.


Still Typing
![](./assets/prem1.png)

Middle cut no "movement"
![](./assets/prem2.png)

Post cut, start typing
![](./assets/prem3.png)

## Todos

Still early in code and working on more things

* [ ] - allow styling control through a `settings.json`
* [ ] - allow "excluded" blocks for like cli runs of in progress code
* [ ] - multi-aspect ratio support
* [ ] - clean up the code 😅