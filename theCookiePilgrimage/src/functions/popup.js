// requires creation of the popups array, bridges object and the popupIndex var

export function openPopup(popupID,left,top,vw,popupComponent){
    let newWindow
    const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
    newWindow = window.open(
        `${base}${popupComponent}/${popupID.value}`, 
        `popup${popupID.value}`,  //provide different names to open multiple popups
        `left=${left},top=${top},width=500,height=500`
    )
    newWindow.resizeTo(window.innerWidth*vw/100*1.04,window.innerWidth*vw/100*1.02)
    return newWindow
}

export function popupNewInstance(popupID,popups,left,top,vw,popupTick,availableBridges,chan,popupComponent="popups"){
    if (availableBridges.value>0){
        availableBridges.value -= 1
        let newPopup = {
            window: openPopup(popupID,left,top,vw,popupComponent),
            locked: false,
            inPos: false,
            inShape: false,
            inPosPrev: false,
            inShapePrev: false,
            id: popupID.value,
        }
        popupID.value += 1
        popups.push(newPopup)
        popups.forEach(elem=>{
            elem.window.focus()
        })
        setTimeout(()=>{
            chan.postMessage({popupType:2,id:newPopup.id,name:newPopup.name})
        },10)
        if (popups.length===1){
            requestAnimationFrame(popupTick)
        }
    }
}

export function popupFixSize(popupWin,vwX,vwY){
    let targetWidthInPx = window.innerWidth*vwX/100
    let targetHeightInPx = window.innerWidth*vwY/100
    if (popupWin.outerWidth!==targetWidthInPx||popupWin.outerHeight!==targetHeightInPx){
        popupWin.resizeTo(targetWidthInPx*1.04,targetHeightInPx*1.02)
    }
}

export function popupFixPosition(popupWin,x,y){
    if (popupWin.screenX!==x||popupWin.screenY!==y){
        popupWin.moveTo(x,y)
    }
}

export function popupSnapCheck(popupObj,bridges,toleranceX=100,toleranceY=100,offsetX=0,offsetY=0){
    //tolerance in px, offset in vw
    let offsetXInPx = offsetX*window.innerWidth/100
    let offsetYInPx = offsetY*window.innerWidth/100
    
    popupObj.inPos = false
    if (!popupObj.locked){
        popupObj.occupyingBridge = "null" // refresh occyping bridge to null every frame if the popup is not locked
    }

    // iterate through bridges and check if the popup is in position
    for (const [key, value] of Object.entries(bridges)) {
        if (Math.abs(popupObj.window.screenX-offsetXInPx-value.xPos)<toleranceX&&Math.abs(popupObj.window.screenY-offsetYInPx-value.yPos)<toleranceY){ // check if in position
            if (!value.occupied) { //check if the space is occupied
                popupObj.inPos = true
                popupObj.lockedPositionX = value.xPos-5
                popupObj.lockedPositionY = value.yPos
                popupObj.occupyingBridge = key
                value.highlight = true
            }
        }
    }
}

export function popupShapeCheck(popupObj,targetWidth,targetHeight){
    let targetWidthInPx = targetWidth*window.innerWidth/100
    let targetHeightInPx = targetHeight*window.innerWidth/100
    if (Math.abs(popupObj.window.outerWidth-targetWidthInPx)<100&&Math.abs(popupObj.window.outerHeight-targetHeightInPx)<100){
        popupObj.inShape = true
    } else {
        popupObj.inShape = false
    }
}

export function popupCloseCheck(popupObj,popups,popupsArrIndex,bridges,availableBridges){
    if (popupObj.window.closed){
        availableBridges.value += 1
        bridges[popupObj.occupyingBridge].highlight = false //when the popup is closed, restore the occupying status of the occupied bridge
        bridges[popupObj.occupyingBridge].occupied = false //when the popup is closed, restore the occupying status of the occupied bridge
        popups.splice(popupsArrIndex,1) //remove the popup from the array if it is closed
    }
}

export function bridgeCheck(bridges){ // return true if all bridges are occupied
    return Object.values(bridges).every(bridge=>bridge.occupied)
}
