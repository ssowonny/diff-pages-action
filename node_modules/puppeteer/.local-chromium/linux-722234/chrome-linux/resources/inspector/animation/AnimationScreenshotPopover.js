export default class AnimationScreenshotPopover extends UI.VBox{constructor(images){super(true);console.assert(images.length);this.registerRequiredCSS('animation/animationScreenshotPopover.css');this.contentElement.classList.add('animation-screenshot-popover');this._frames=images;for(const image of images){this.contentElement.appendChild(image);image.style.display='none';}
this._currentFrame=0;this._frames[0].style.display='block';this._progressBar=this.contentElement.createChild('div','animation-progress');}
wasShown(){this._rafId=this.contentElement.window().requestAnimationFrame(this._changeFrame.bind(this));}
willHide(){this.contentElement.window().cancelAnimationFrame(this._rafId);delete this._endDelay;}
_changeFrame(){this._rafId=this.contentElement.window().requestAnimationFrame(this._changeFrame.bind(this));if(this._endDelay){this._endDelay--;return;}
this._showFrame=!this._showFrame;if(!this._showFrame){return;}
const numFrames=this._frames.length;this._frames[this._currentFrame%numFrames].style.display='none';this._currentFrame++;this._frames[(this._currentFrame)%numFrames].style.display='block';if(this._currentFrame%numFrames===numFrames-1){this._endDelay=50;}
this._progressBar.style.width=(this._currentFrame%numFrames+1)/numFrames*100+'%';}}
self.Animation=self.Animation||{};Animation=Animation||{};Animation.AnimationScreenshotPopover=AnimationScreenshotPopover;