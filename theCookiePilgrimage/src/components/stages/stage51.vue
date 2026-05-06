<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter, useRoute} from "vue-router"
import Nekomimi from "../character/Nekomimi.vue"
import gsap from "gsap"
import Loading from "../global/loading.vue"

let router = useRouter()
const route = useRoute()
const browserTopHeight = window.outerHeight - window.innerHeight + window.screenY
const nextButtonDom = useTemplateRef("nextButtonDom")
const naotoAnimSequence = ref(null)
const nekomimiAnimSequence = ref(null)
const navItem5DropdownMovableDom = useTemplateRef("navItem5DropdownMovableDom")
const navItem5DropdownContainerDom = useTemplateRef("navItem5DropdownContainerDom")
const navItem5TitleContainerDom = useTemplateRef("navItem5TitleContainerDom")
const shakableBodyDom = useTemplateRef("shakableBodyDom")
const shakableBodyOnTopDom = useTemplateRef("shakableBodyOnTopDom")
const shieldDom = useTemplateRef("shieldDom")
const hpBarDom = useTemplateRef("hpBarDom")
let chan

//level related
let charPos = ref(0)
let hp = ref(5)
const loadingState = ref(true)
let nekomimiVisible = ref(false)

onMounted(() => {
    chan = new BroadcastChannel("global")
    chan.onmessage=(e)=>{ //snap popup on message
        if (e.data.type==="handshake"){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:3})
        }
    }
    
    setTimeout(() => {
        nekomimiVisible.value = true
    }, 100)
})

function nekomimiPosUpdate(pos){
    if (pos===4){ // what happens after nekomimi is summoned
        charPos.value = 4
        let tl = gsap.timeline()
        navItem5TitleContainerDom.value.style.backgroundColor = "#696969"
        tl.to(navItem5DropdownContainerDom.value, {
            y: "15vw",
            duration: 1,
            ease: "bounce.out",
        })
        screenShake()
        tl.call(() => {
            shakableBodyOnTopDom.value.style.display = "block"
        }, [], "+=0.5")
    } else if (pos===5){ // what happens after nekomimi is defeated
        router.push("/airHockey")
    }
}

function screenShake(){
    let tl = gsap.timeline()
    tl.to(shakableBodyDom.value, {
        x: "-2vw",
        y: "-1vh",
        duration: 0.1,
        ease: "linear",
    })
    tl.to(shakableBodyDom.value, {
        x: "+4vw",
        y: "+3vh",
        duration: 0.1,
        ease: "linear",
    })
    tl.to(shakableBodyDom.value, {
        x: 0,
        y: 0,
        duration: 0.1,
        ease: "linear",
    })
}

function hpBarUpdate(){
    if (hp.value > 0){
        gsap.to(hpBarDom.value, {
            width: "-=16vw",
            duration: 0.3,
            ease: "none",
        })
        hp.value -= 1
        if (hp.value <= 0){
            nekomimiAnimSequence.value = "stage51End"
        }
    }
}

function shieldClickAction(){
    shakableBodyOnTopDom.value.style.display = "none"
    shieldDom.value.style.display = "flex"
    shieldDom.value.style.left = 45 + "vw"
    shieldDom.value.style.top = (50*window.innerHeight/100 - 5*window.innerWidth/100) + "px"
    nekomimiAnimSequence.value = "stage51OnePunch"
    document.addEventListener("mousemove", (e) => {
        shieldDom.value.style.left = e.clientX - 5*window.innerWidth/100 + "px"
        shieldDom.value.style.top = e.clientY - 5*window.innerWidth/100 + "px"
    })
    gsap.to(hpBarDom.value, {
        width: "80vw",
        duration: 2,
        ease: "none",
    })
}


</script>

<template>
    <div id="body" >
        <div id="shakableBody" ref="shakableBodyDom">
            <header>
            <div id="titleContainer">
                <h1 id="titleWaypoint">Waypoint</h1>
                <h2 id="titleAfterWaypoint">for web travellers</h2>
            </div>
        </header>
        <nav>
            <div id="navTitlesBackground"></div>
            <div class="navItem" id="navItem1">
                <div class="navItemTitleContainer"><p class="navItemTitle">Authentication</p></div>
            </div>
            <div id="navItem2" class="navItem">
                <div class="navItemTitleContainer"><p class="navItemTitle">Transit</p></div>
            </div>
                <div id="navItem3" class="navItem">
                <div class="navItemTitleContainer"><p class="navItemTitle">Maintainance</p></div>
            </div>
            <div id="navItem4" class="navItem">
                <div class="navItemTitleContainer"><p class="navItemTitle">Entertainment</p></div>
            </div>
            <div id="navItem5" class="navItem">
                <div class="navItemTitleContainer" ref="navItem5TitleContainerDom"><p class="navItemTitle">Traveller Tools</p></div>
                <div id="navItem5DropdownMovable" ref="navItem5DropdownMovableDom">
                    <div class="navItemDropdownContainer" id="navItem5DropdownContainer" ref="navItem5DropdownContainerDom">
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Router</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Site Map</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Shield</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Artifact Map</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Browser</p></div>
                    </div>
                </div>
            </div>
        </nav>
        <div id="footer">
            <div id="footerText">Copyright © 2026 Web Waypoint, All Rights Reserved</div>
        </div>
        </div>
        <div id="shakableBodyOnTop" ref="shakableBodyOnTopDom">
            <div id="navItem5" class="navItem">
                <div class="navItemDropdownContainer" id="navItem5DropdownContainerOnTop">
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Router</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Site Map</p></div>
                    <div class="navItemDropdownItemContainer"
                    @click="shieldClickAction"
                    ><p class="navItemDropdownItemText">Shield</p></div>
                    <div class="navItemDropdownItemContainer" ><p class="navItemDropdownItemText grayedOut">Artifact Map</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText grayedOut">Browser</p></div>
                </div>
            </div>
        </div>
    </div>
    <button id="shield" ref="shieldDom">Click at the right moment to parry!</button>    
    <Loading v-if="loadingState"/>
    <Nekomimi
    v-if="nekomimiVisible"
    :parentComponent="'stage51'" 
    :animSequenceProp="nekomimiAnimSequence" 
    @nekomimiPosUpdate="nekomimiPosUpdate" 
    @screenShake="screenShake" 
    @hpBarUpdate="hpBarUpdate" 
    @nekomimiLoadingUpdate="loadingState = false" />
    <div id="hpBar" ref="hpBarDom"></div>
    
</template>



<style scoped>
#body {
    position: relative;
    overflow: hidden;
}

#shakableBody{
    position: fixed;
    width: 100vw;
    height: 100vh;
}

header{
    position: fixed;
    width: 100vw;
    height: calc(100vh - 37vw);
    top: 0;
    left: 0;
    overflow: hidden;
    background-color: #383838;
    box-sizing: border-box;
}

#titleContainer{
    width: 100vw;
    height: 3vw;
    padding-left: 5vw;
    bottom: 0.5vw;
    left: 0;
    position: absolute;
}

#titleWaypoint{
    display: inline-block;
    font-size: 2vw;
    font-weight: bold;
    color: #fff;
    margin-right: 0.5vw;
}

#titleAfterWaypoint{
    display: inline-block;
    font-size: 1vw;
    font-weight: bold;
    color: #fff;
}

nav{
    position: absolute;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100vw;
    height: 4vw;
    top: calc(100vh - 37vw);
    left: 0;
    padding: 0 10vw;
    box-sizing: border-box;
}

#navTitlesBackground{
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background-color: #484848;
    z-index: -1;
}

.navItem{
    font-size: 1vw;
    font-weight: bold;
    color: #fff;
    width: 15vw;
    height: 100%;
}

.navItemTitleContainer{
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
}

.navItem:hover .navItemTitleContainer{
    background-color: #696969;
}

.navItemDropdownContainer{
    display: none;
    width: 100%;
    background-color: #696969;
    flex-direction: column;
    cursor: pointer;
}

.navItemDropdownItemContainer{
    width: 100%;
    height: 3vw;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5vw 0;
    box-sizing: border-box;
}

#navItem5DropdownMovable{
    position: relative;
    width: 100%;
    height: 15vw;
    overflow: hidden;
}

#navItem5DropdownContainer{
    position: relative;
    display: flex;
    top: -15vw;
    z-index: 4;
}

.navItemDropdownItemContainer:hover{
    background-color: #383838;
}


#footer{
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 10vh;
    bottom: 0;
    left: 0;
    overflow: hidden;
    background-color: #383838;
}

#footerText{
    color: #aaa;
}


</style>

<style scoped>  

#shakableBodyOnTop{
    display: none;
    position: fixed;
    width: 100vw;
    height: 100vh;
    z-index: 4;
}

#navItem5DropdownContainerOnTop{
    position: absolute;
    top: calc(100vh - 33vw);
    right: 10.8vw;
    width: 15vw;
    display: flex;
}

#shield{
    position: fixed;
    display: none;
    width: 10vw;
    height: 10vw;
    top: 0;
    left: 0;
    z-index: 5;
    pointer-events: none;
}

#hpBar{
    position: fixed;
    width: 0vw;
    height: 1vw;
    bottom: 6vw;
    left: 10vw;
    background-color: #600303;
    z-index: 4;
}

.grayedOut{
    color: #aaa;
}

#nekomimi{
    position: fixed;
}
</style>