<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter} from "vue-router"
import { popupNewInstance, popupFixSize, popupFixPosition, popupSnapCheck, popupCloseCheck, bridgeCheck } from "../../functions/popup"
import Naoto from "../character/Naoto.vue"
import Loading from "../global/loading.vue"

let router = useRouter()

const browserTopHeight = window.outerHeight - window.innerHeight + window.screenY
const bridges = {
    left: {
        dom: useTemplateRef("bridgesLeftDom"),
        highlight: false,
        occupied: false,
        xPos: window.innerWidth*32.5/100,
        yPos: window.innerHeight*48/100+browserTopHeight
    },
    right: {
        dom: useTemplateRef("bridgesRightDom"),
        highlight: false,
        occupied: false,
        xPos: window.innerWidth*52.5/100,
        yPos: window.innerHeight*38/100+browserTopHeight
    }
}
let availableBridges = reactive({value: 2})
const nextButton = useTemplateRef("nextButton")
const popupButton = useTemplateRef("popupButton")
const animSequence = ref(null)
let popups = []
let popupID = {value: 0}
let chan
const loadingState = ref(true)

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
    window.focus()
    popups.forEach((elem,i)=>{ 
        if (document.hasFocus()){
            console.log("focus")
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
    if (bridgeCheck(bridges)){
        animSequence.value = "stage21NextLevel"
    }
    requestAnimationFrame(popupTick)
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
    router.push('/stretchedPopupBridges')
}

</script>

<template>
    <div id="body">
        <button id="popupButton" @click="popupNewInstance(popupID,popups,500,200,15,popupTick,availableBridges,chan)" ref="popupButton">Create a popup window, {{ availableBridges.value }} available</button>
        <div class="block" id="leftPlatform">Before the World Wide Web, computer networks were developed to allow distant machines to exchange information. Projects such as ARPANET demonstrated that data could be divided into packets, sent across different routes, and reassembled at its destination. These systems created the technical foundation for later forms of online communication.

            <br><br>The early network was used mainly by researchers, universities, laboratories, and government institutions. It was not yet a public space in the modern sense. Access was limited, interfaces were technical, and navigation required knowledge of specific commands and addresses.</div>
        <div class="block" id="leftBridge" ref="bridgesLeftDom"></div>
        <div class="block" id="rightBridge" ref="bridgesRightDom"></div>
        <button id="nextButton" @click="nextButtonAction" ref="nextButton">next</button>
        <div class="block" id="rightPlatform">Hypertext is a method of organizing information through linked documents. Instead of reading in a fixed linear order, a user may follow connections from one piece of text to another. This idea became one of the central principles of the web.

            <br><br>Earlier hypertext systems explored the possibility of non-linear writing, reference networks, and interactive documents. The web later transformed this concept into a global structure, where any page could point toward another through a hyperlink.</div>
    </div>
    <Loading v-if="loadingState"/>
    <Naoto id="naoto" :parentComponent="'stage21'" :animSequenceProp="animSequence" @nextButtonActivated="nextButton.disabled = false" @naotoLoadingUpdate="loadingState = false" />
</template>



<style scoped>
#body {
    position: relative;
}

#leftPlatform{
    position: fixed;
    width: 23vw;
    height: 35vh;
    left: 5vw;
    bottom: 10vh;
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

#leftBridge{
    position: fixed;
    box-sizing: border-box;
    width: 15vw;
    height: 15vw;
    left: 32.5vw;
    top: 48vh;
    border-style: hidden;
    border-width: 4px;
}

#rightBridge{
    position: fixed;
    box-sizing: border-box;
    width: 15vw;
    height: 15vw;
    right: 32.5vw;
    top: 38vh;
    border-style: hidden;
    border-width: 4px;
}

#popupButton{
    position: fixed;
    left: 5vw;
    top: 20vh;
}

#nextButton{
    position: fixed;
    right: 10vw;
    top: 25vh;
}

#nextButton:disabled {
    color: #aaa;
}

#naoto{
    position: fixed;
    z-index: -2;
}
</style>