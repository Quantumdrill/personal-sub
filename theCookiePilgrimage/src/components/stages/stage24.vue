<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter} from "vue-router"
import Naoto from "../character/Naoto.vue"
import ResetScreen from "../global/resetScreen.vue"
import Loading from "../global/loading.vue"

let router = useRouter()

const nextButton = useTemplateRef("nextButton")
const appearanceButton = useTemplateRef("appearanceButton")
const bodyDom = useTemplateRef("bodyDom")
const resetScreenState = ref(false)
const loadingState = ref(true)
const animSequence = ref(null)
let naotoLocalVars = reactive({
    stage24Appearance: true,
})
let appearance = ref(true) //false = in dark mode, showing "Light Mode" button
let naotoPos = 1


onMounted(() => {
    nextButton.value.disabled = true
})

function changeAppearance(){ 
    if (!appearance.value){
        appearance.value = true
        bodyDom.value.style.backgroundColor = "#ffffff"
        naotoLocalVars.stage24Appearance = true
    } else {
        appearance.value = false
        bodyDom.value.style.backgroundColor = "#000000"
        naotoLocalVars.stage24Appearance = false
    }
    switch (naotoPos){
        case 1:
            animSequence.value = "stage24AppearanceCheck"
            setTimeout(() => {
                animSequence.value = "stage24InitDrop"
            }, 1)
            break
        case 2:
            animSequence.value = null // reset the prop first, wait a ms, and then set the new prop value, to trigger the watcher
            setTimeout(() => {
                animSequence.value = "stage24AppearanceCheck"
            }, 1)
            break
        case 3:
            animSequence.value = null // reset the prop first, wait a ms, and then set the new prop value, to trigger the watcher
            setTimeout(() => {
                animSequence.value = "stage24AppearanceCheck"
            }, 1)
            animSequence.value = "stage24SecondDrop"
            break
        case 4:
            animSequence.value = null // reset the prop first, wait a ms, and then set the new prop value, to trigger the watcher
            setTimeout(() => {
                animSequence.value = "stage24AppearanceCheck"
            }, 1)
            break
        default:
            break
    }
}

function naotoPosUpdate(pos){
    naotoPos = pos
}

function nextButtonAction(){
    router.push('/submarine')
}

</script>
<template>
    <div id="body" ref="bodyDom"></div>
    <button id="appearanceButton" @click="changeAppearance" ref="appearanceButton">{{!appearance?"Light":"Dark"}} Mode</button>
    <div class="block" v-if="appearance" id="initBPlatform">The web browser became the main vehicle for traveling through the web. It translated code into visible pages, allowed users to follow links, and provided interface elements such as the address bar, back button, bookmarks, tabs, and scrollbars.</div>
    <div class="block" v-if="!appearance" id="leftUpperWPlatform">As browsers developed, they became more than document viewers. They turned into platforms capable of running scripts, displaying media, storing local data, and supporting complex applications. For many users, the browser became the primary entrance to the digital world.}}</div>
    <div class="block" v-if="!appearance" id="rightUpperWPlatform">Web portals attempted to organize the growing web into central starting points. They offered search, news, weather, email, directories, entertainment links, and other services from a single page.</div>
    <div class="block" v-if="appearance" id="midBPlatform">As the number of web pages increased, search engines became necessary tools for navigation. They indexed pages, ranked results, and allowed users to find information without knowing exact addresses.

<br><br>Search changed the structure of online movement. Instead of traveling only through links, users could begin with a question, keyword, or phrase. The search box became a gateway, and visibility within search results became a form of territory.

<br><br>Personal homepages were an important part of early web culture. Users created pages to introduce themselves, collect links, share interests, publish diaries, display images, or experiment with design.

<br><br>These pages were often handmade, uneven, and expressive. They treated the web as a personal space rather than only a commercial or institutional system. Many used bright colors, animated images, guestbooks, counters, tiled backgrounds, and informal writing.</div>
    <div class="block" v-if="appearance" id="rightLowerWPlatform">The portal treated the web as a city that needed a main station. From one interface, users could depart toward different categories of information. For a time, portals shaped how many visitors understood the web: less as an open wilderness, more as a mapped public square.</div>
    <div class="block" v-if="appearance" id="leftLowerWPlatform">Forums and message boards allowed users to gather around shared topics. Discussions were organized into threads, with replies accumulating over time. These spaces created persistent communities where knowledge, jokes, arguments, and identities could develop.</div>
    <button id="nextButton" @click="nextButtonAction" ref="nextButton">next</button>
    <ResetScreen v-if="resetScreenState"/>
    <Loading v-if="loadingState"/>
    <Naoto id="naoto" :parentComponent="'stage24'" 
    :animSequenceProp="animSequence" 
    :naotoLocalVarsProp="naotoLocalVars" 
    @nextButtonActivated="nextButton.disabled = false" 
    @naotoPosUpdate="naotoPosUpdate"
    @operationButtonOperation="(e)=>appearanceButton.disabled = !e" 
    @resetScreen="resetScreenState = true"
    @naotoLoadingUpdate="loadingState = false"
    />

</template>
<style scoped>

#body {
    position: relative;
    width: 100vw;
    height: 100vh;
    background-color: #ffffff;
    z-index: 0;
}

#appearanceButton{
    position: fixed;
    top: 10vh;
    right: 10vw;
    z-index: 2;
}

#initBPlatform{
    position: fixed;
    width: 18vw;
    height: 10vh;
    left: 5vw;
    top: 20vh;
    overflow: hidden;
    z-index: 2;
}


#leftUpperWPlatform{
    position: fixed;
    width: 20vw;
    height: 10vh;
    left: 5vw;
    top: 50vh;
    overflow: hidden;
    color: #ffffff;
    z-index: 2;
}

#rightUpperWPlatform{
    position: fixed;
    width: 20vw;
    height: 10vh;
    right: 5vw;
    top: 50vh;
    overflow: hidden;
    color: #ffffff;
}

#midBPlatform{
    position: fixed;
    width: 18vw;
    height: 45vh;
    left: 44vw;
    bottom: 5vh;
    overflow: hidden;
}

#rightLowerWPlatform{
    position: fixed;
    width: 26vw;
    height: 10vh;
    right: 5vw;
    bottom: 5vh;
    overflow: hidden;
}

#leftLowerWPlatform{
    position: fixed;
    width: 19vw;
    height: 10vh;
    left: 25vw;
    bottom: 5vh;
    overflow: hidden;
}

#nextButton{
    position: fixed;
    left: 26vw;
    bottom: 18vh;
    z-index: 2;
}

#nextButton:disabled {
    color: #aaa;
}

#naoto{
    position: fixed;
    top: 0;
    z-index: 1;
}

</style>