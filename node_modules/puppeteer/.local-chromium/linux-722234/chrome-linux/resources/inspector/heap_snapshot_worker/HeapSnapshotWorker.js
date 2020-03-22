function postMessageWrapper(message){postMessage(message);}
const dispatcher=new HeapSnapshotWorker.HeapSnapshotWorkerDispatcher(this,postMessageWrapper);function installMessageEventListener(listener){self.addEventListener('message',listener,false);}
installMessageEventListener(dispatcher.dispatchMessage.bind(dispatcher));