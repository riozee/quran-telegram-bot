# quran-telegram-bot

Contributions are Welcome!

## Demo

[@fio_quran_bot](https://t.me/fio_quran_bot)<br />
<img width="75%" src="http://telegra.ph/file/7fb77352bd87372bd0d52.jpg"/>

## Run

Tested on Node.js v14.x.x with NPM v6.x.x, Windows 10 and Ubuntu 18.04.6 LTS.

1. Create bot using [@BotFather](https://t.me/BotFather), save the bot token.
2. Get your Telegram user ID. You can get your user ID using the available bots (search for "user id bot" in Telegram).
3. Clone this project

```
git clone https://github.com/riozec/quran-telegram-bot
cd quran-telegram-bot
```

4. Create a `.env` file, write down your bot token and API key here.

```
touch .env
nano .env
```

Write to `.env` file:

```
BOT_TOKEN="YOUR BOT TOKEN"
OWNER_USER_ID="YOUR USER ID"
```

5. Build and run the bot.

```
npm install
npm run build
npm start
```

6.  Now the bot is running, but can't send surah audios. Because Telegram bot can't send more than 50 MB, you need a `file_id` of already uploaded file. In order to solve this, you need to manually forward all surah audios to the bot. Here's the steps:

    -   Send `/getsurahaudiofileid` command to the bot. The bot will respond with an `"OK"`.
    -   Open this [channel](https://t.me/fio_bot_quran_surah_audio) and forward all audios to the bot (114 audios).
    -   The bot will respond with a `"Done"` if it has done saving the 114 audios.

7.  (Optional) You can save the `file_id` of the short tutorial video in the channel to show it in the `/start` command.
    1. Forward the video to the bot.
    2. Quote the video, and send this command:
    ```
    /eval ctx.message.reply_to_message.animation.file_id
    ```
    3. Copy the `file_id`, and paste it to the `.env` file by adding this line:
    ```
    START_VIDEO_TUTORIAL_FILE_ID="FILE_ID HERE"
    ```

## Thanks to

-   Allah SWT
-   Telegraf
-   Ecoslow
-   LoLHuman
-   Everyayah.com
-   Equran.id
-   semarketir/quranjson
-   And other sources of data, written in the files.

## Donation

-   0877-2271-3834 (DANA)
-   0851-5823-1152 (OVO, ShopeePay)
