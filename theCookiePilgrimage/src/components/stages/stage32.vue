<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter} from "vue-router"
import { popupNewInstance, popupFixSize, popupFixPosition, popupSnapCheck, popupCloseCheck, bridgeCheck } from "../../functions/popup"
import Naoto from "../character/Naoto.vue"
import Pretext from "../global/pretext.vue"
import Loading from "../global/loading.vue"


let vhToPx = window.innerHeight/100
let vwToPx = window.innerWidth/100

let router = useRouter()
const browserTopHeight = window.outerHeight - window.innerHeight + window.screenY
const bridges = {
    start: {
        dom: useTemplateRef("bridgeStartDom"),
        highlight: false,
        occupied: false,
        xPos: window.innerWidth*30/100,
        yPos: window.innerHeight*25/100+browserTopHeight
    }
}
const endBridgeDom = useTemplateRef("bridgeEndDom")
let availableBridges = reactive({value: 1})
const nextButton = useTemplateRef("nextButton")
const popupButton = useTemplateRef("popupButton")
const naotoVisible = ref(true)
const naotoPos = ref(1)
const animSequence = ref(null)
const loadingState = ref(true)
let popups = []
let popupID = {value: 0}
let chan

//pretext related
let popupObstacle = reactive({
    x: 0,
    y: 0,
    width: 15*vwToPx,
    height: 15*vhToPx,
})

onMounted(() => {
    for (let i=0;i<popups.length;i++){
        popups[i].window.close()
    }
    nextButton.value.disabled = true

    chan = new BroadcastChannel("global")
    chan.onmessage=(e)=>{ //snap popup on message
        if (e.data.type==="snapButtonAction"){
            let popup
            popups.forEach(elem=>{
                if (elem.id===e.data.id){
                    popup = elem
                }
            })
            bridges[popup.occupyingBridge].occupied = true
            popup.locked = true
        }
        if (e.data.type==="handshake"){
            chan.postMessage({type:"typeInitialize",id:e.data.id,popupType:1})
        }
        if (e.data.type==="stage32PopupComm"){
            if (e.data.action===2){  // triggered when naoto landed in submarine
                popups[0].locked = false
                naotoPos.value = 2
                naotoVisible.value = false
                bridges.end = {
                    dom: endBridgeDom,
                    highlight: false,
                    occupied: false,
                    xPos: window.innerWidth*76/100,
                    yPos: window.innerHeight*90/100-window.innerWidth*15/100+browserTopHeight
                }
            }
            if (e.data.action === "next"){
                nextButtonAction()
            }
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

    popupObstacleUpdate()

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
        popupSnapCheck(elem,bridges)
        

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

    bridgeHighlightUpdate()
    if (bridges.start.occupied){ // start init anim
        animSequence.value = "stage32Outer"
        chan.postMessage({type:"stage32PopupComm",id:popups[0].id,action:"init"})
    }
    if (bridges.end !== undefined){
        if (bridges.end.occupied){ // show next button in submarine
            naotoPos.value = 3
            chan.postMessage({type:"stage32PopupComm",id:popups[0].id,action:naotoPos.value})
        }
    }
    requestAnimationFrame(popupTick)
}

function popupObstacleUpdate(){
    popupObstacle.x = popups[0].window.screenX
    popupObstacle.y = popups[0].window.screenY-browserTopHeight
    popupObstacle.width = 15*vwToPx
    popupObstacle.height = 15*vwToPx
    if (popups.length===0){
        popupObstacle.x = 0
        popupObstacle.y = 0
        popupObstacle.width = 0
        popupObstacle.height = 0
    }
}

function bridgeHighlightUpdate(){ // update after snap check
    for (const [key, value] of Object.entries(bridges)) { 
        value.dom.value.style.borderStyle = "hidden" //erase the dashed borders every frame before checking highlight status
        if (value.highlight){ //add dashed border if the bridge is highlighted
            value.dom.value.style.borderStyle = "dashed"
        }
    }
}

function nextButtonAction(){
    for (let i=0;i<popups.length;i++){
        popups[i].window.close()
    }
    router.push('/morePopups')
}

function naotoPosUpdate(pos){
    naotoPos.value = pos
}

</script>

<template>
    <div id="body">
        <button id="popupButton" @click="popupNewInstance(popupID,popups,500,200,15,popupTick,availableBridges,chan,'popupsSubmarine')" ref="popupButton">Create a popup window, {{ availableBridges.value }} available</button>
        <div class="block" id="leftPlatform">Unlike static pages, forums made the web feel inhabited. A visitor could return to the same thread and find that it had changed. The page became a conversation, and the conversation became part of the landscape.</div>
        <div class="block" id="startBridge" ref="bridgeStartDom"></div>
        <div class="block" id="endBridge" ref="bridgeEndDom"></div>
        <button id="nextButton" @click="nextButtonAction" ref="nextButton">next</button>
        <Pretext id="pretext" :popupObstacle="popupObstacle" />
    </div>
    <Loading v-if="loadingState"/>
    <Naoto id="naoto" v-if="naotoVisible" 
    :parentComponent="'stage32'" 
    :animSequenceProp="animSequence" 
    @nextButtonActivated="nextButton.disabled = false" 
    @naotoPosUpdate="naotoPosUpdate" 
    @naotoLoadingUpdate="loadingState = false" />
</template>



<style scoped>
#body {
    position: relative;
}

#leftPlatform{
    position: fixed;
    width: 23vw;
    height: 6vh;
    left: 5vw;
    top: 20vh;
    overflow: hidden;
}

#rightPlatform{
    position: fixed;
    width: 23vw;
    height: 35vh;
    right: 5vw;
    top: 30vh;
    overflow: hidden;
}

#startBridge{
    position: fixed;
    box-sizing: border-box;
    width: 15vw;
    height: 15vw;
    left: 30vw;
    top: 25vh;
    border-style: hidden;
    border-width: 4px;
}

#endBridge{
    position: fixed;
    box-sizing: border-box;
    width: 15vw;
    height: 15vw;
    right: 9vw;
    bottom: 10vh;
    border-style: hidden;
    border-width: 4px;
}

#popupButton{
    position: fixed;
    left: 5vw;
    top: 15vh;
    z-index: 2;
}

#nextButton{
    position: fixed;
    right: 10vw;
    bottom: 20vh;
}

#nextButton:disabled {
    color: #aaa;
}

#naoto{
    position: fixed;
}

#pretext{
    position: fixed;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    left: 0;
    top: 0;
    filter: blur(0.5px);
    pointer-events: none;
    z-index: -1;
}
</style>