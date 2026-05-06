<script setup>
import {useRouter} from "vue-router"
import { ref, onMounted, useTemplateRef } from "vue"
import Naoto from "../character/Naoto.vue"
import gsap from "gsap"
import Loading from "../global/loading.vue"

const router = useRouter()

let initialized = false
const animSequence = ref(null)
const naotoDom = useTemplateRef("naotoDom")
const cookieFrameContainerDom = useTemplateRef("cookieFrameContainerDom")
const cookieBoxDom = useTemplateRef("cookieBoxDom")
const loadingState = ref(true)

window.onload = () => {
    window.scrollTo(0,0)
}

onMounted(() => {
    naotoDom.value.$el.style.bottom = `-${0.08*window.innerWidth+(2.15-window.innerWidth/window.innerHeight)*120}px`
})

function naotoPosUpdate(pos){
    if (pos===2){
        gsap.to(cookieFrameContainerDom.value, {
            duration: 1,
            opacity: 0,
            ease: "power1.inOut",
        })
    } else if (pos===3){
        gsap.to(cookieBoxDom.value, {
            duration: 1,
            y: "-21vh",
            ease: "power2.inOut",
        })
    }
}

window.addEventListener("scroll", (e) => {
    if (window.scrollY > 170*window.innerWidth/100 && !initialized){
        animSequence.value = "stage7"
        initialized = true
    }
})
</script>
<template>
    <div id="page">
        <div id="h1Container">
            <h1>The Cookie Chamber</h1>
        </div>
        <div id="historyContainer">
            <h4 class="historyH4">Early baking traditions</h4>
            <p class="historyP">Small portions of dough were baked before larger cakes or loaves to test oven temperature. These early “cookies” functioned as minor, practical companions to larger baked goods.</p>    
            <h4 class="historyH4">17th century — “Koekje”</h4>
            <p class="historyP">The English word “cookie” is commonly traced to the Dutch koekje, meaning “little cake.” The term entered wider use through Dutch influence in North America.</p>
            <h4 class="historyH4">18th–19th centuries — Domestic object</h4>
            <p class="historyP">The cookie became a familiar household food: portable, inexpensive, easily stored, and commonly associated with hospitality, travel, and everyday consumption.</p>
            <h4 class="historyH4">Late 20th century — “Magic cookie” in computing</h4>
            <p class="historyP">In computer science, a “magic cookie” referred to a small piece of data passed between programs as a token of identification or recognition. It did not need to be understood by the user; it only needed to be returned.</p>
            <h4 class="historyH4">1994 — The browser cookie</h4>
            <p class="historyP">Lou Montulli at Netscape developed the HTTP cookie as a way for websites to remember information between page requests. This allowed the early web to support sessions, shopping carts, logins, and returning visitors.</p>
            <h4 class="historyH4">Late 1990s — The remembered visitor</h4>
            <p class="historyP">Cookies became a standard part of web browsing. They helped websites recognize users, preserve preferences, and maintain continuity across different pages.</p>
            <h4 class="historyH4">2000s — Tracking and personalization</h4>
            <p class="historyP">Cookies expanded beyond convenience. They became widely used for analytics, advertising, behavioral tracking, and personalized content, making them both useful and controversial.</p>
            <h4 class="historyH4">2010s — Consent and regulation</h4>
            <p class="historyP">As privacy concerns increased, cookie notices and consent banners became common. The phrase “accept cookies” turned a hidden technical process into a visible ritual of permission.</p>
            <h4 class="historyH4">Present day — The symbolic cookie</h4>
            <p class="historyP">The cookie now carries two histories at once: a small sweet object offered to a guest, and a small data object used to remember a visitor.</p>
        </div>
        <div id="cookieFrameContainer" ref="cookieFrameContainerDom">
            <div id="cookieFrame">

            </div>
            <h2 id="cookieTitle">The Holy Cookie</h2>
        </div>
        <Naoto id="naoto" 
        ref="naotoDom"
        :parentComponent="'stage7'" 
        :animSequenceProp="animSequence" 
        :naotoLocalVarsProp="naotoLocalVars" 
        @naotoPosUpdate="naotoPosUpdate"
        @naotoLoadingUpdate="loadingState = false"
        />
    </div>
    <div id="cookieBox" ref="cookieBoxDom">
        <h3 id="cookieBoxTitle" >Cookies?</h3>
        <div id="cookieButtons">
            <button id="cookieAcceptButton" class="cookieButton" @click="router.push('/thankYou')">Accept</button>
            <button id="cookieYesButton" class="cookieButton" @click="router.push('/thankYou')">Yes</button>
            <button id="cookieThankButton" class="cookieButton" @click="router.push('/thankYou')">Thank You</button>
        </div>
    </div>
    <Loading v-if="loadingState"/>
</template>
<style scoped>
#page {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;
}

#h1Container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50vw;
}

h1 {
    font-size: 4vw;
}

h2 {
    font-size: 1vw;
}

#historyContainer{
    width: 100vw;
    height: 150vw;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20vw;
    box-sizing: border-box;
}

.historyH4{
    font-size: 1.5vw;
    font-weight: bold;
    margin: 1vw 0;
    margin-top: 6vw;
}

.historyP{
    font-size: 1vw;
    margin: 1vw 0;
}

#cookieFrameContainer{
    width: 100vw;
    height: 40vw;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
}

#cookieFrame{
    width: 15vw;
    height: 15vw;
    position: relative;
    top: 7vw;
    border-style: dotted;
    border-width: 2px;
    border-radius: 7.5vw;
    border-color: #d4d4d4;
}

#cookieTitle{
    position: relative;
    width: 10vw;
    top: 18vw;
    justify-content: center;
    align-items: center;
    text-align: center;
}

#naoto{
    position: absolute;
    bottom: -8vw;
    left: 0;
    width: 100vw;
    height: 50vw;
    z-index: 1;
}

button{
    padding: 0;
}

#cookieBox{
    position: fixed;
    bottom: -10.5vw;
    right: 10vw;
    width: 20vw;
    height: 10vw;
    z-index: 2;
    display: flex;
    border-style: solid;
    background-color: #ffffff;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

#cookieBoxTitle{
    font-size: 150%;
    margin: 1vw;
}

#cookieButtons{
    display: flex;
    justify-content: center;
    align-items: center;
}

.cookieButton{
    margin: 0.3vw;
    padding: 0.2vw;
}
</style>