<script setup>
import {useRouter} from "vue-router"
let router = useRouter()
</script>
<template>
    <div id="startPageBody">
        <p>Welcome! Please read the following before starting the journey.</p>
        <p>This is a web game that utilizes popup windows as a part of the gameplay, meaning that it is manipulating the browser at a system level.</p>
        <p>Because of this, there are some limitations to the game and some requirements that you need to follow during the game:</p>
        <ul>
            <br></br>
            <h4>Operating System Related</h4>
            <li>If you are on <b>Windows</b>, you are good to go.</li>
            <li>If you are on <b>macOS</b>, there are more limitations and due to an extremely strict browser and popup window policy on macOS:</li>
            <li>The web experience is now currently only available on wide-screen desktop devices.</li>
            <ul>
                <li>To interact with popup windows normally, open the dev tools of the browser, undock it and minimize it at all times during gameplay. <br>
                    To do this, Command + Option + I, then Command + Shift + D, then minimize the undocked window.</li>
                <li>Safari is not supported.</li>
            </ul>
            <br></br>
            <h4>Browser Window Related</h4>
            <li>The game is tested to be running flawlessly on Google Chrome and Microsoft Edge. Firefox might be laggy and unstable.</li>
            <li><b>Please keep the main browser window maximized at all times, and try not to resize or move it. </b></li>
            <li><b>But don't make the browser full screen by hitting F11 or the green button if on macOS, the url bar and other windows needs to be visible.</b></li>
            <li>Dual monitors (or more) might cause popup positioning issues on certain browsers. Try to place the browser window on the main monitor.</li>
            <li>Ultrawide monitors may cause display issues.</li>
            <br></br>
            <h4>Popup Window Related</h4>
            <li>If you are prompted with a "Popup Blocked" warning, allow the use of popup windows and refresh the page.</li>
            <li>You can ignore any translation prompts from the popup windows.</li>
            <li>Try not to "shake" the popup window back and forth because it will minimize the main window.</li>
            <li>Try not to close any popup window during a level.</li>
            <li>If you have to refresh the page, close all the popups and then refresh.</li>
            <br></br>
            <li>There may still be some popup positioning issues and other minor bugs, try refreshing the page if encountered and sorry for the inconvenience.</li>
        </ul>
        <button id="startButton" @click="router.push('/webArtifacts')">Start</button>
    </div>
</template>
<style scoped>
#startPageBody{
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

#startButton{
    margin-top: 2vw;
}
</style>