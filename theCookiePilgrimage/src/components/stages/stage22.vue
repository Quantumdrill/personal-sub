<script setup>
import {ref, onMounted, useTemplateRef, reactive, watch} from "vue"
import {useRouter} from "vue-router"
import { popupNewInstance, popupFixSize, popupFixPosition, popupSnapCheck, popupCloseCheck, bridgeCheck, popupShapeCheck } from "../../functions/popup"
import Naoto from "../character/Naoto.vue"
import Loading from "../global/loading.vue"

let router = useRouter()
const browserTopHeight = window.outerHeight - window.innerHeight + window.screenY
const bridges = {
    center: {
        dom: useTemplateRef("bridgesCenterDom"),
        highlight: false,
        occupied: false,
        xPos: window.innerWidth*32/100, 
        yPos: window.innerHeight*55/100+browserTopHeight
    },
}
let availableBridges = reactive({value: 1})
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
    popups.forEach((elem,i)=>{ 
        if (document.hasFocus()){
            elem.window.focus()
        }
        popupCloseCheck(elem,popups,i,bridges,availableBridges)
        if (elem.locked){
            popupFixPosition(elem.window,elem.lockedPositionX,elem.lockedPositionY)
            popupFixSize(elem.window,36,15)
        }
        popupSnapCheck(elem,bridges,window.innerWidth/100*18+100,100,10)
        popupShapeCheck(elem,36,15)

        // broadcast popup inpositio status to the popup
        if (elem.inPos!==elem.inPosPrev||elem.inShape!==elem.inShapePrev){ //check if popup inPosition state changes
            if (elem.inPos===true&&elem.inShape===true){
                chan.postMessage({type:"snapButtonShow",id:elem.id,action:true})
            } else {
                chan.postMessage({type:"snapButtonShow",id:elem.id,action:false})
            }
        }
        elem.inPosPrev = elem.inPos
        elem.inShapePrev = elem.inShape
    })

    bridgeHighlightUpdate()
    if (bridgeCheck(bridges)){
        animSequence.value = "stage22NextLevel"
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
    router.push('/darkMode')
}

</script>

<template>
    <div id="body">
        <button id="popupButton" @click="popupNewInstance(popupID,popups,500,200,15,popupTick,availableBridges,chan)" ref="popupButton">Create a popup window, {{ availableBridges.value }} available</button>
        <div class="block" id="leftPlatform">The World Wide Web was proposed as a system for sharing information across networked computers. It combined three major elements: addresses for locating resources, a transfer protocol for requesting documents, and a markup language for structuring pages.

<br><br>This combination allowed documents to be published, linked, and viewed across different machines. The web began as a practical information system, but quickly developed into a public environment for communication, commerce, entertainment, archives, and personal expression.</div>
        <div class="block" id="centerBridge" ref="bridgesCenterDom"></div>
        <button id="nextButton" @click="nextButtonAction" ref="nextButton">next</button>
        <div class="block" id="rightPlatform">Early web pages were mostly text-based documents. They used simple markup to define headings, paragraphs, lists, and links. Images and advanced layouts were limited, and pages often appeared as plain collections of information rather than designed visual spaces.

            <br><br>Despite their simplicity, early pages introduced a new form of publishing. A document could be uploaded to a server and reached from another location through a browser. The page became both a document and a place.</div>
    </div>
    <Loading v-if="loadingState"/>
    <Naoto id="naoto" :parentComponent="'stage22'" :animSequenceProp="animSequence" @nextButtonActivated="nextButton.disabled = false" @naotoLoadingUpdate="loadingState = false" />
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
    bottom: 10vh;
    overflow: hidden;
}

#centerBridge{
    position: fixed;
    box-sizing: border-box;
    width: 36vw;
    height: 15vw;
    left: 32vw;
    top: 55vh;
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
    top: 50vh;
}

#nextButton:disabled {
    color: #aaa;
}

#naoto{
    position: fixed;
    z-index: -2;
}
</style>