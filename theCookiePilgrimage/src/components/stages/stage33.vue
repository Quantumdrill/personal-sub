<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch, nextTick} from "vue"
import {useRouter, useRoute} from "vue-router"
import { popupNewInstance, popupFixSize, popupFixPosition, popupSnapCheck, popupCloseCheck, bridgeCheck } from "../../functions/popup"
import Naoto from "../character/Naoto.vue"
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
let popups = []
let popupID = {value: 0}
let availableBridges = ref(1)
let chan
const naotoLoadingState = ref(true)
const nekomimiLoadingState = ref(true)
const nekomimiComponentMounted = ref(true)

//level related
let yesOrNo = ref(null)
let yesOrNoPrev = ref(null)
let nekomimiVisible = ref(false)
let naotoVisible = ref(true)
let naotoAnimStage = ref("watching")
let charPos = ref(0)
let popupFlyingState = ref(false)
let urlPromptVisible = ref(false)

onMounted(() => {

    for (let i=0;i<popups.length;i++){
        popups[i].window.close()
    }
    nextButtonDom.value.disabled = true

    chan = new BroadcastChannel("global")
    chan.onmessage=(e)=>{ //snap popup on message
        if (e.data.type==="handshake"){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:3})
        }
    }
    
    setTimeout(() => {
        naotoAnimSequence.value = "stage33Init"
        
    }, 1000)
    
    watch(yesOrNo, (e)=>{
        if (charPos.value===1){
            yesOrNoPrev.value = yesOrNo.value 
            setTimeout(()=>{ // prevent immediate change
                if (yesOrNoPrev.value === e && naotoAnimStage.value === "watching"){
                    if (e===true){
                        naotoAnimSequence.value = "stage33Yes"
                    } else if (e===false){
                        naotoAnimSequence.value = "stage33No"
                    } else if (e===null){
                        naotoAnimSequence.value = "stage33Idle"
                    }
                }
            }, 200)
        }
    })

    watch(
        () => route.query.uninvitedGuest,
        (newValue) => {
            if (newValue === "false") {
                nekomimiComponentMounted.value = false
                router.push('/shield')
            }
        },
        {
            immediate: true
        }
    )
})


function popupTick(){
    if (popups.length<1){
        cancelAnimationFrame(popupTick)
    }

    //iterate for all opened popups
    popups.forEach((elem,i)=>{ 
        if (document.hasFocus()){
            elem.window.focus()
        }
        popupFixSize(elem.window,15,15)
        if (elem.locked){
            popupFixPosition(elem.window,elem.lockedPositionX,elem.lockedPositionY)
        }
    })

    //stabbed popup update
    if (popupFlyingState.value===true){
        popups[0].lockedPositionX -= 1*window.innerWidth/100
        if (popups[0].window.screenX <= 5){
            popupFlyingState.value = false
            popups[0].window.close()
        }
    }
    requestAnimationFrame(popupTick)
}

function nekomimiPosUpdate(pos){
    if (pos===2){ // what happens after nekomimi is summoned
        let tl = gsap.timeline()
        tl.to(navItem5DropdownContainerDom.value, {
            y: "-15vw",
            duration: 0.2,
            ease: "power2.inOut",
            onComplete: () => {
                navItem5DropdownContainerDom.value.style.display = "none"
                navItem5TitleContainerDom.value.style.backgroundColor = "#484848"
            }
        })
        tl.call(() => {
            nextButtonDom.value.style.display = "none"
            nextButtonDom.value.style.bottom = "16vw"
            nextButtonDom.value.style.right = "12vw"
            nextButtonDom.value.disabled = false
        }, [], "+=5.4")
        tl.call(() => {
            popupNewInstance(popupID,popups,5*window.innerWidth/100,90*window.innerHeight/100+browserTopHeight-15*window.innerWidth/100,15,popupTick,availableBridges,chan,'popupsSubmarine')
            popups[0].lockedPositionX = 5*window.innerWidth/100
            popups[0].lockedPositionY = 90*window.innerHeight/100+browserTopHeight-15*window.innerWidth/100
            popups[0].locked = true
        }, [], "+=0.2")
        tl.call(() => {
            nextButtonDom.value.style.display = "block"
            nextButtonDom.value.style.rotate = "-10deg"
        }, [], "+=1.3")
        tl.to(nextButtonDom.value, {
            x: "-65vw",
            y: "+8vw",
            ease: "none",
            duration: 0.1,
            onComplete: () => {
                // nextButtonDom.value.style.rotate = "20deg"
                chan.postMessage({type:"stage33PopupComm",id:popups[0].id,action:"stabbed"})
            }
        })
        tl.call(() => {
            nextButtonDom.value.style.display = "none"
        }, [], "+=0")
        tl.call(() => {
            popupFlyingState.value = true
        }, [], "+=0.5")
        tl.call(() => {
            urlPromptVisible.value = true
        }, [], "+=3")
    } 
}

function naotoPosUpdate(pos){
    if (pos===1){ // what happens after nekomimi is summoned
        charPos.value = 1
    } else if (pos===4){ // what happens after naoto is stabbed in submarine
        charPos.value = 4
        naotoVisible.value = false
    }
}

function artifactMapClickAction(){
    nekomimiVisible.value = true; 
    nekomimiAnimSequence.value = 'stage33Init';
    navItem5DropdownMovableDom.value.style.display = 'block';
    navItem5DropdownContainerDom.value.style.display = 'flex';
    navItem5TitleContainerDom.value.style.backgroundColor = '#696969';
    naotoAnimStage.value = 'attacked';
    naotoAnimSequence.value = 'stage33Attacked';
    router.replace({
        query: {uninvitedGuest: true}
    })
    
}

</script>

<template>
    <div id="body">
        <header>
            <div id="titleContainer">
                <h1 id="titleWaypoint">Waypoint</h1>
                <h2 id="titleAfterWaypoint">for web travellers</h2>
            </div>
        </header>
        <nav>
            <div id="navTitlesBackground"></div>
            <div class="navItem" id="navItem1" @mouseenter="yesOrNo = false" @mouseleave="yesOrNo = null">
                <div class="navItemTitleContainer"><p class="navItemTitle">Authentication</p></div>
                <div class="navItemDropdownContainer" id="navItem1DropdownContainer">
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Captcha</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Guest Pass</p></div>
                </div>
            </div>
            <div id="navItem2" class="navItem" @mouseenter="yesOrNo = false" @mouseleave="yesOrNo = null">
                <div class="navItemTitleContainer"><p class="navItemTitle">Transit</p></div>
                <div class="navItemDropdownContainer" id="navItem2DropdownContainer">
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Redirect</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Links</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Embeds</p></div>
                </div>
            </div>
                <div id="navItem3" class="navItem" @mouseenter="yesOrNo = false" @mouseleave="yesOrNo = null">
                <div class="navItemTitleContainer"><p class="navItemTitle">Maintainance</p></div>
                <div class="navItemDropdownContainer" id="navItem3DropdownContainer">
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Errors</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Cache Cleanup</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Bug Reports</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Patches</p></div>
                </div>
            </div>
            <div id="navItem4" class="navItem" @mouseenter="yesOrNo = false" @mouseleave="yesOrNo = null">
                <div class="navItemTitleContainer"><p class="navItemTitle">Entertainment</p></div>
                <div class="navItemDropdownContainer" id="navItem4DropdownContainer">
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Media</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Live Stream</p></div>
                    <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Community</p></div>
                </div>
            </div>
            <div id="navItem5" class="navItem">
                <div class="navItemTitleContainer" ref="navItem5TitleContainerDom"><p class="navItemTitle">Traveller Tools</p></div>
                <div id="navItem5DropdownMovable" ref="navItem5DropdownMovableDom">
                    <div class="navItemDropdownContainer" id="navItem5DropdownContainer" ref="navItem5DropdownContainerDom">
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Router</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Site Map</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Shield</p></div>
                        <div class="navItemDropdownItemContainer" 
                        @mouseenter="yesOrNo = true" 
                        @mouseleave="yesOrNo = null" 
                        @click="artifactMapClickAction"
                        ><p class="navItemDropdownItemText">Artifact Map</p></div>
                        <div class="navItemDropdownItemContainer"><p class="navItemDropdownItemText">Browser</p></div>
                    </div>
                </div>
            </div>
        </nav>
        <div id="urlPrompt" v-if="urlPromptVisible">Try modify the URL</div>
        <button id="nextButton" @click="nextButtonAction" ref="nextButtonDom">next</button>
        <div id="footer">
            <div id="footerText">Copyright © 2026 Web Waypoint, All Rights Reserved</div>
        </div>
    </div>
    <Loading v-if="naotoLoadingState||nekomimiLoadingState"/>
    <Naoto id="naoto" 
    v-show="naotoVisible" 
    :parentComponent="'stage33'" 
    :animSequenceProp="naotoAnimSequence" 
    @nextButtonActivated="nextButton.disabled = false" 
    @naotoPosUpdate="naotoPosUpdate" 
    @naotoLoadingUpdate="naotoLoadingState = false" />
    <Nekomimi id="nekomimi" 
    v-if="nekomimiComponentMounted"
    v-show="nekomimiVisible" 
    :parentComponent="'stage33'" 
    :animSequenceProp="nekomimiAnimSequence" 
    @nekomimiPosUpdate="nekomimiPosUpdate" 
    @nekomimiLoadingUpdate="nekomimiLoadingState = false" />
    
</template>



<style scoped>
#body {
    position: relative;
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

#navItem5DropdownMovable{
    display: none;
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
.navItemDropdownItemContainer:hover{
    background-color: #383838;
}

#navItem1:hover #navItem1DropdownContainer{
    background-color: #696969;
    display: flex;
}

#navItem2:hover #navItem2DropdownContainer{
    background-color: #696969;
    display: flex;
}

#navItem3:hover #navItem3DropdownContainer{
    background-color: #696969;
    display: flex;
}

#navItem4:hover #navItem4DropdownContainer{
    background-color: #696969;
    display: flex;
}

#navItem5:hover #navItem5DropdownMovable{
    background-color: #696969;
    display: block;
}

#navItem5:hover #navItem5DropdownContainer{
    background-color: #696969;
    display: flex;
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

#nextButton{
    position: fixed;
    right: 10vw;
    bottom: 8vw;
}

#nextButton:disabled {
    color: #aaa;
}

#naoto{
    position: fixed;
    z-index: -2;
}

#nekomimi{
    position: fixed;
}

#urlPrompt{
    position: fixed;
    width: 100vw;
    height: 100vh;
    left: 40vw;
    top: 5vh;
    color: #e83434;
    font-size: 1.5vw;
    z-index: 10;
}
</style>