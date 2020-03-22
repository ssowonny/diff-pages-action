export default class ConsoleViewport{constructor(provider){this.element=createElement('div');this.element.style.overflow='auto';this._topGapElement=this.element.createChild('div');this._topGapElement.style.height='0px';this._topGapElement.style.color='transparent';this._contentElement=this.element.createChild('div');this._bottomGapElement=this.element.createChild('div');this._bottomGapElement.style.height='0px';this._bottomGapElement.style.color='transparent';this._topGapElement.textContent='\uFEFF';this._bottomGapElement.textContent='\uFEFF';UI.ARIAUtils.markAsHidden(this._topGapElement);UI.ARIAUtils.markAsHidden(this._bottomGapElement);this._provider=provider;this.element.addEventListener('scroll',this._onScroll.bind(this),false);this.element.addEventListener('copy',this._onCopy.bind(this),false);this.element.addEventListener('dragstart',this._onDragStart.bind(this),false);this._contentElement.addEventListener('focusin',this._onFocusIn.bind(this),false);this._contentElement.addEventListener('focusout',this._onFocusOut.bind(this),false);this._contentElement.addEventListener('keydown',this._onKeyDown.bind(this),false);this._virtualSelectedIndex=-1;this._contentElement.tabIndex=-1;this._firstActiveIndex=-1;this._lastActiveIndex=-1;this._renderedItems=[];this._anchorSelection=null;this._headSelection=null;this._itemCount=0;this._cumulativeHeights=new Int32Array(0);this._muteCopyHandler=false;this._observer=new MutationObserver(this.refresh.bind(this));this._observerConfig={childList:true,subtree:true};}
stickToBottom(){return this._stickToBottom;}
setStickToBottom(value){this._stickToBottom=value;if(this._stickToBottom){this._observer.observe(this._contentElement,this._observerConfig);}else{this._observer.disconnect();}}
hasVirtualSelection(){return this._virtualSelectedIndex!==-1;}
copyWithStyles(){this._muteCopyHandler=true;this.element.ownerDocument.execCommand('copy');this._muteCopyHandler=false;}
_onCopy(event){if(this._muteCopyHandler){return;}
const text=this._selectedText();if(!text){return;}
event.preventDefault();event.clipboardData.setData('text/plain',text);}
_onFocusIn(event){const renderedIndex=this._renderedItems.findIndex(item=>item.element().isSelfOrAncestor(event.target));if(renderedIndex!==-1){this._virtualSelectedIndex=this._firstActiveIndex+renderedIndex;}
let focusLastChild=false;if(this._virtualSelectedIndex===-1&&this._isOutsideViewport((event.relatedTarget))&&event.target===this._contentElement&&this._itemCount){focusLastChild=true;this._virtualSelectedIndex=this._itemCount-1;this.refresh();this.scrollItemIntoView(this._virtualSelectedIndex);}
this._updateFocusedItem(focusLastChild);}
_onFocusOut(event){if(this._isOutsideViewport((event.relatedTarget))){this._virtualSelectedIndex=-1;}
this._updateFocusedItem();}
_isOutsideViewport(element){return!!element&&!element.isSelfOrDescendant(this._contentElement);}
_onDragStart(event){const text=this._selectedText();if(!text){return false;}
event.dataTransfer.clearData();event.dataTransfer.setData('text/plain',text);event.dataTransfer.effectAllowed='copy';return true;}
_onKeyDown(event){if(UI.isEditing()||!this._itemCount||event.shiftKey){return;}
let isArrowUp=false;switch(event.key){case'ArrowUp':if(this._virtualSelectedIndex>0){isArrowUp=true;this._virtualSelectedIndex--;}else{return;}
break;case'ArrowDown':if(this._virtualSelectedIndex<this._itemCount-1){this._virtualSelectedIndex++;}else{return;}
break;case'Home':this._virtualSelectedIndex=0;break;case'End':this._virtualSelectedIndex=this._itemCount-1;break;default:return;}
event.consume(true);this.scrollItemIntoView(this._virtualSelectedIndex);this._updateFocusedItem(isArrowUp);}
_updateFocusedItem(focusLastChild){const selectedElement=this.renderedElementAt(this._virtualSelectedIndex);const changed=this._lastSelectedElement!==selectedElement;const containerHasFocus=this._contentElement===this.element.ownerDocument.deepActiveElement();if(this._lastSelectedElement&&changed){this._lastSelectedElement.classList.remove('console-selected');}
if(selectedElement&&(focusLastChild||changed||containerHasFocus)&&this.element.hasFocus()){selectedElement.classList.add('console-selected');if(focusLastChild){this.setStickToBottom(false);this._renderedItems[this._virtualSelectedIndex-this._firstActiveIndex].focusLastChildOrSelf();}else if(!selectedElement.hasFocus()){focusWithoutScroll(selectedElement);}}
if(this._itemCount&&!this._contentElement.hasFocus()){this._contentElement.tabIndex=0;}else{this._contentElement.tabIndex=-1;}
this._lastSelectedElement=selectedElement;function focusWithoutScroll(element){element.focus({preventScroll:true});}}
contentElement(){return this._contentElement;}
invalidate(){delete this._cachedProviderElements;this._itemCount=this._provider.itemCount();if(this._virtualSelectedIndex>this._itemCount-1){this._virtualSelectedIndex=this._itemCount-1;}
this._rebuildCumulativeHeights();this.refresh();}
_providerElement(index){if(!this._cachedProviderElements){this._cachedProviderElements=new Array(this._itemCount);}
let element=this._cachedProviderElements[index];if(!element){element=this._provider.itemElement(index);this._cachedProviderElements[index]=element;}
return element;}
_rebuildCumulativeHeights(){const firstActiveIndex=this._firstActiveIndex;const lastActiveIndex=this._lastActiveIndex;let height=0;this._cumulativeHeights=new Int32Array(this._itemCount);for(let i=0;i<this._itemCount;++i){if(firstActiveIndex<=i&&i-firstActiveIndex<this._renderedItems.length&&i<=lastActiveIndex){height+=this._renderedItems[i-firstActiveIndex].element().offsetHeight;}else{height+=this._provider.fastHeight(i);}
this._cumulativeHeights[i]=height;}}
_rebuildCumulativeHeightsIfNeeded(){let totalCachedHeight=0;let totalMeasuredHeight=0;for(let i=0;i<this._renderedItems.length;++i){const cachedItemHeight=this._cachedItemHeight(this._firstActiveIndex+i);const measuredHeight=this._renderedItems[i].element().offsetHeight;if(Math.abs(cachedItemHeight-measuredHeight)>1){this._rebuildCumulativeHeights();return;}
totalMeasuredHeight+=measuredHeight;totalCachedHeight+=cachedItemHeight;if(Math.abs(totalCachedHeight-totalMeasuredHeight)>1){this._rebuildCumulativeHeights();return;}}}
_cachedItemHeight(index){return index===0?this._cumulativeHeights[0]:this._cumulativeHeights[index]-this._cumulativeHeights[index-1];}
_isSelectionBackwards(selection){if(!selection||!selection.rangeCount){return false;}
const range=document.createRange();range.setStart(selection.anchorNode,selection.anchorOffset);range.setEnd(selection.focusNode,selection.focusOffset);return range.collapsed;}
_createSelectionModel(itemIndex,node,offset){return{item:itemIndex,node:node,offset:offset};}
_updateSelectionModel(selection){const range=selection&&selection.rangeCount?selection.getRangeAt(0):null;if(!range||selection.isCollapsed||!this.element.hasSelection()){this._headSelection=null;this._anchorSelection=null;return false;}
let firstSelected=Number.MAX_VALUE;let lastSelected=-1;let hasVisibleSelection=false;for(let i=0;i<this._renderedItems.length;++i){if(range.intersectsNode(this._renderedItems[i].element())){const index=i+this._firstActiveIndex;firstSelected=Math.min(firstSelected,index);lastSelected=Math.max(lastSelected,index);hasVisibleSelection=true;}}
if(hasVisibleSelection){firstSelected=this._createSelectionModel(firstSelected,(range.startContainer),range.startOffset);lastSelected=this._createSelectionModel(lastSelected,(range.endContainer),range.endOffset);}
const topOverlap=range.intersectsNode(this._topGapElement)&&this._topGapElement._active;const bottomOverlap=range.intersectsNode(this._bottomGapElement)&&this._bottomGapElement._active;if(!topOverlap&&!bottomOverlap&&!hasVisibleSelection){this._headSelection=null;this._anchorSelection=null;return false;}
if(!this._anchorSelection||!this._headSelection){this._anchorSelection=this._createSelectionModel(0,this.element,0);this._headSelection=this._createSelectionModel(this._itemCount-1,this.element,this.element.children.length);this._selectionIsBackward=false;}
const isBackward=this._isSelectionBackwards(selection);const startSelection=this._selectionIsBackward?this._headSelection:this._anchorSelection;const endSelection=this._selectionIsBackward?this._anchorSelection:this._headSelection;if(topOverlap&&bottomOverlap&&hasVisibleSelection){firstSelected=firstSelected.item<startSelection.item?firstSelected:startSelection;lastSelected=lastSelected.item>endSelection.item?lastSelected:endSelection;}else if(!hasVisibleSelection){firstSelected=startSelection;lastSelected=endSelection;}else if(topOverlap){firstSelected=isBackward?this._headSelection:this._anchorSelection;}else if(bottomOverlap){lastSelected=isBackward?this._anchorSelection:this._headSelection;}
if(isBackward){this._anchorSelection=lastSelected;this._headSelection=firstSelected;}else{this._anchorSelection=firstSelected;this._headSelection=lastSelected;}
this._selectionIsBackward=isBackward;return true;}
_restoreSelection(selection){let anchorElement=null;let anchorOffset;if(this._firstActiveIndex<=this._anchorSelection.item&&this._anchorSelection.item<=this._lastActiveIndex){anchorElement=this._anchorSelection.node;anchorOffset=this._anchorSelection.offset;}else{if(this._anchorSelection.item<this._firstActiveIndex){anchorElement=this._topGapElement;}else if(this._anchorSelection.item>this._lastActiveIndex){anchorElement=this._bottomGapElement;}
anchorOffset=this._selectionIsBackward?1:0;}
let headElement=null;let headOffset;if(this._firstActiveIndex<=this._headSelection.item&&this._headSelection.item<=this._lastActiveIndex){headElement=this._headSelection.node;headOffset=this._headSelection.offset;}else{if(this._headSelection.item<this._firstActiveIndex){headElement=this._topGapElement;}else if(this._headSelection.item>this._lastActiveIndex){headElement=this._bottomGapElement;}
headOffset=this._selectionIsBackward?0:1;}
selection.setBaseAndExtent(anchorElement,anchorOffset,headElement,headOffset);}
refresh(){this._observer.disconnect();this._innerRefresh();if(this._stickToBottom){this._observer.observe(this._contentElement,this._observerConfig);}}
_innerRefresh(){if(!this._visibleHeight()){return;}
if(!this._itemCount){for(let i=0;i<this._renderedItems.length;++i){this._renderedItems[i].willHide();}
this._renderedItems=[];this._contentElement.removeChildren();this._topGapElement.style.height='0px';this._bottomGapElement.style.height='0px';this._firstActiveIndex=-1;this._lastActiveIndex=-1;this._updateFocusedItem();return;}
const selection=this.element.getComponentSelection();const shouldRestoreSelection=this._updateSelectionModel(selection);const visibleFrom=this.element.scrollTop;const visibleHeight=this._visibleHeight();const activeHeight=visibleHeight*2;this._rebuildCumulativeHeightsIfNeeded();if(this._stickToBottom){this._firstActiveIndex=Math.max(this._itemCount-Math.ceil(activeHeight/this._provider.minimumRowHeight()),0);this._lastActiveIndex=this._itemCount-1;}else{this._firstActiveIndex=Math.max(this._cumulativeHeights.lowerBound(visibleFrom+1-(activeHeight-visibleHeight)/2),0);this._lastActiveIndex=this._firstActiveIndex+Math.ceil(activeHeight/this._provider.minimumRowHeight())-1;this._lastActiveIndex=Math.min(this._lastActiveIndex,this._itemCount-1);}
const topGapHeight=this._cumulativeHeights[this._firstActiveIndex-1]||0;const bottomGapHeight=this._cumulativeHeights[this._cumulativeHeights.length-1]-this._cumulativeHeights[this._lastActiveIndex];function prepare(){this._topGapElement.style.height=topGapHeight+'px';this._bottomGapElement.style.height=bottomGapHeight+'px';this._topGapElement._active=!!topGapHeight;this._bottomGapElement._active=!!bottomGapHeight;this._contentElement.style.setProperty('height','10000000px');}
this._partialViewportUpdate(prepare.bind(this));this._contentElement.style.removeProperty('height');if(shouldRestoreSelection){this._restoreSelection(selection);}
if(this._stickToBottom){this.element.scrollTop=10000000;}}
_partialViewportUpdate(prepare){const itemsToRender=new Set();for(let i=this._firstActiveIndex;i<=this._lastActiveIndex;++i){itemsToRender.add(this._providerElement(i));}
const willBeHidden=this._renderedItems.filter(item=>!itemsToRender.has(item));for(let i=0;i<willBeHidden.length;++i){willBeHidden[i].willHide();}
prepare();let hadFocus=false;for(let i=0;i<willBeHidden.length;++i){hadFocus=hadFocus||willBeHidden[i].element().hasFocus();willBeHidden[i].element().remove();}
const wasShown=[];let anchor=this._contentElement.firstChild;for(const viewportElement of itemsToRender){const element=viewportElement.element();if(element!==anchor){const shouldCallWasShown=!element.parentElement;if(shouldCallWasShown){wasShown.push(viewportElement);}
this._contentElement.insertBefore(element,anchor);}else{anchor=anchor.nextSibling;}}
for(let i=0;i<wasShown.length;++i){wasShown[i].wasShown();}
this._renderedItems=Array.from(itemsToRender);if(hadFocus){this._contentElement.focus();}
this._updateFocusedItem();}
_selectedText(){this._updateSelectionModel(this.element.getComponentSelection());if(!this._headSelection||!this._anchorSelection){return null;}
let startSelection=null;let endSelection=null;if(this._selectionIsBackward){startSelection=this._headSelection;endSelection=this._anchorSelection;}else{startSelection=this._anchorSelection;endSelection=this._headSelection;}
const textLines=[];for(let i=startSelection.item;i<=endSelection.item;++i){const element=this._providerElement(i).element();const lineContent=element.childTextNodes().map(Components.Linkifier.untruncatedNodeText).join('');textLines.push(lineContent);}
const endSelectionElement=this._providerElement(endSelection.item).element();if(endSelection.node&&endSelection.node.isSelfOrDescendant(endSelectionElement)){const itemTextOffset=this._textOffsetInNode(endSelectionElement,endSelection.node,endSelection.offset);textLines[textLines.length-1]=textLines.peekLast().substring(0,itemTextOffset);}
const startSelectionElement=this._providerElement(startSelection.item).element();if(startSelection.node&&startSelection.node.isSelfOrDescendant(startSelectionElement)){const itemTextOffset=this._textOffsetInNode(startSelectionElement,startSelection.node,startSelection.offset);textLines[0]=textLines[0].substring(itemTextOffset);}
return textLines.join('\n');}
_textOffsetInNode(itemElement,selectionNode,offset){if(selectionNode.nodeType!==Node.TEXT_NODE){if(offset<selectionNode.childNodes.length){selectionNode=(selectionNode.childNodes.item(offset));offset=0;}else{offset=selectionNode.textContent.length;}}
let chars=0;let node=itemElement;while((node=node.traverseNextNode(itemElement))&&node!==selectionNode){if(node.nodeType!==Node.TEXT_NODE||node.parentElement.nodeName==='STYLE'||node.parentElement.nodeName==='SCRIPT'){continue;}
chars+=Components.Linkifier.untruncatedNodeText(node).length;}
const untruncatedContainerLength=Components.Linkifier.untruncatedNodeText(selectionNode).length;if(offset>0&&untruncatedContainerLength!==selectionNode.textContent.length){offset=untruncatedContainerLength;}
return chars+offset;}
_onScroll(event){this.refresh();}
firstVisibleIndex(){if(!this._cumulativeHeights.length){return-1;}
this._rebuildCumulativeHeightsIfNeeded();return this._cumulativeHeights.lowerBound(this.element.scrollTop+1);}
lastVisibleIndex(){if(!this._cumulativeHeights.length){return-1;}
this._rebuildCumulativeHeightsIfNeeded();const scrollBottom=this.element.scrollTop+this.element.clientHeight;const right=this._itemCount-1;return this._cumulativeHeights.lowerBound(scrollBottom,undefined,undefined,right);}
renderedElementAt(index){if(index===-1||index<this._firstActiveIndex||index>this._lastActiveIndex){return null;}
return this._renderedItems[index-this._firstActiveIndex].element();}
scrollItemIntoView(index,makeLast){const firstVisibleIndex=this.firstVisibleIndex();const lastVisibleIndex=this.lastVisibleIndex();if(index>firstVisibleIndex&&index<lastVisibleIndex){return;}
if(index===lastVisibleIndex&&this._cumulativeHeights[index]<=this.element.scrollTop+this._visibleHeight()){return;}
if(makeLast){this.forceScrollItemToBeLast(index);}else if(index<=firstVisibleIndex){this.forceScrollItemToBeFirst(index);}else if(index>=lastVisibleIndex){this.forceScrollItemToBeLast(index);}}
forceScrollItemToBeFirst(index){console.assert(index>=0&&index<this._itemCount,'Cannot scroll item at invalid index');this.setStickToBottom(false);this._rebuildCumulativeHeightsIfNeeded();this.element.scrollTop=index>0?this._cumulativeHeights[index-1]:0;if(this.element.isScrolledToBottom()){this.setStickToBottom(true);}
this.refresh();this.renderedElementAt(index).scrollIntoView(true);}
forceScrollItemToBeLast(index){console.assert(index>=0&&index<this._itemCount,'Cannot scroll item at invalid index');this.setStickToBottom(false);this._rebuildCumulativeHeightsIfNeeded();this.element.scrollTop=this._cumulativeHeights[index]-this._visibleHeight();if(this.element.isScrolledToBottom()){this.setStickToBottom(true);}
this.refresh();this.renderedElementAt(index).scrollIntoView(false);}
_visibleHeight(){return this.element.offsetHeight;}}
class ConsoleViewportProvider{fastHeight(index){return 0;}
itemCount(){return 0;}
minimumRowHeight(){return 0;}
itemElement(index){return null;}}
export class ConsoleViewportElement{willHide(){}
wasShown(){}
element(){}}
self.Console=self.Console||{};Console=Console||{};Console.ConsoleViewport=ConsoleViewport;Console.ConsoleViewportProvider=ConsoleViewportProvider;Console.ConsoleViewportElement=ConsoleViewportElement;