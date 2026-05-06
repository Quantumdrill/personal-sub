<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter} from "vue-router"
import { popupNewInstance, popupFixSize, popupFixPosition, popupSnapCheck, popupCloseCheck, bridgeCheck } from "../../functions/popup"
import Naoto from "../character/Naoto.vue"
import * as THREE from "three"
import Loading from "../global/loading.vue"

let router = useRouter()

const browserTopHeight = window.outerHeight - window.innerHeight + window.screenY
const bridges = {
    one: {
        dom: useTemplateRef("bridgeDom"),
        highlight: false,
        occupied: false,
        xPos: window.innerWidth*40/100,
        yPos: (window.innerHeight*40-window.innerWidth*15)/100+browserTopHeight
    },
}
let availableBridges = reactive({value: 1})
const nextButton = useTemplateRef("nextButton")
const popupButton = useTemplateRef("popupButton")
const animSequence = ref(null)
const clock = new THREE.Timer()
let popups = []
let popupID = {value: 0}
let chan
let popupPushedState = ref("idle")
let dropSpeed = 5
let accumulatedDelta = 0
const loadingState = ref(true)

onMounted(() => {
    for (let i=0;i<popups.length;i++){
        popups[i].window.close()
    }
    nextButton.value.disabled = true

    chan = new BroadcastChannel("global")
    chan.onmessage=(e)=>{ //snap popup on message
        if (e.data.type==="handshake"){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:2})
        }
    }
    
    watch(availableBridges, (e)=>{
        if (availableBridges.value===0){
            popupButton.value.disabled = true
        } else {
            popupButton.value.disabled = false
        }
    })

})


function popupTick(){
    if (popups.length<1){
        cancelAnimationFrame(popupTick)
    }

    // disable dashed border highlight every frame before snap check
    // can't iterate through popups because the each popup's snap check will overwrite the status of the previous popup snap check
    for (const [key, value] of Object.entries(bridges)) {
        value.highlight = false
    }

    //iterate for all opened popups
    popups.forEach((elem,i)=>{ 
        if (document.hasFocus()){
            elem.window.focus()
        }
        popupCloseCheck(elem,popups,i,bridges,availableBridges)
        popupFixSize(elem.window,15,15)
        if (elem.locked){
            popupFixPosition(elem.window,elem.lockedPositionX,elem.lockedPositionY)
        }

        // broadcast popup inpositio status to the popup
        if (elem.inPos!==elem.inPosPrev){ //check if popup inPosition state changes
            if (elem.inPos===true){
                chan.postMessage({type:"snapButtonShow",id:elem.id,action:true})
            } else {
                chan.postMessage({type:"snapButtonShow",id:elem.id,action:false})
            }
        }
        elem.inPosPrev = elem.inPos

        
    })

    requestAnimationFrame(popupTick)
}

function tick60fps(){ // 60fps update for popup movement
    clock.update()
    let delta = clock.getDelta()
    accumulatedDelta += delta
    if (accumulatedDelta >= 1/60){
        accumulatedDelta = 0
    }

    if (popups.length>0){
        if (popupPushedState.value==="pushed"){
            popups[0].lockedPositionX += 2.3*window.innerWidth/100/60
        } else if (popupPushedState.value==="dropping"&&popups[0].window.screenY<(window.innerHeight*90-window.innerWidth*15)/100+browserTopHeight-10){ // check if the popup is not at the bottom of the screen
            popups[0].lockedPositionY += dropSpeed*window.innerWidth/100/60
            dropSpeed += 0.5
        }
    }
    requestAnimationFrame(tick60fps)
}

function nextButtonAction(){
    for (let i=0;i<popups.length;i++){
        popups[i].window.close()
    }
    router.push('/waypoint')
}

requestAnimationFrame(tick60fps)

</script>

<template>
    <div id="body">
        <button id="popupButton" @click="
        popupNewInstance(popupID,popups,bridges.one.xPos,bridges.one.yPos,15,popupTick,availableBridges,chan);
        popups[0].locked = true;
        popups[0].lockedPositionX = bridges.one.xPos;
        popups[0].lockedPositionY = bridges.one.yPos;
        animSequence = 'stage31Go';
        " ref="popupButton">Create a popup window</button>
        <div class="block" id="platform">
            <div class="block" id="platformText">As the web matured, page design became more complex. Tables, frames, stylesheets, scripts, and later responsive layouts changed how information was arranged on screen. The page was no longer only a document; it became an interface.

            <br><br>Design decisions shaped how users moved. Menus, buttons, columns, banners, sidebars, and footers created paths of attention. The structure of a page began to guide behavior as much as its written content did.</div>
        </div>
        <div class="block" id="bridge" ref="bridgeDom"></div>
        <div id="footer">
            <div id="footerDivider"></div>
            <div id="footerText">Copyright © 2026 Toby Lu, All Rights Reserved</div>
        </div>
        <button id="nextButton" @click="nextButtonAction" ref="nextButton">next</button>
    </div>
    <Loading v-if="loadingState"/>
    <Naoto id="naoto" :parentComponent="'stage31'" :animSequenceProp="animSequence" 
    @nextButtonActivated="nextButton.disabled = false" 
    @popupPushedStateUpdate="(e)=>popupPushedState = e" 
    @naotoLoadingUpdate="loadingState = false" />
</template>



<style scoped>
#body {
    position: relative;
}

#platform{
    position: fixed;
    width: 40vw;
    height: 25vh;
    left: 20vw;
    top: 40vh;
    overflow: hidden;
    border-style: solid;
    border-radius: 0.5vw;
    border-color: #ddd;
    border-width: 2px;
    padding: 2vw;
    box-sizing: border-box;
}

#bridge{
    position: fixed;
    box-sizing: border-box;
    width: 15vw;
    height: 15vw;
    left: 40vw;
    top: calc(40vh - 15vw);
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
}

#footerDivider{
    position: fixed;
    width: 80vw;
    height: 2px;
    bottom: 10vh;
    left: 10vw;
    background-color: #ddd;
}

#footerText{
    color: #aaa;
}

#popupButton{
    position: fixed;
    left: 5vw;
    top: 20vh;
}

#nextButton{
    position: fixed;
    right: 20vw;
    bottom: 50vh;
}

#nextButton:disabled {
    color: #aaa;
}

#naoto{
    position: fixed;
    z-index: -2;
}
</style>