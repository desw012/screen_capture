// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, screen, desktopCapturer, ipcMain } = require('electron')
const path = require('path')
const fs = require("fs");



const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {


    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


ipcMain.on('command:capture', async () => {
        const displays = screen.getAllDisplays();

        const map = new Map();
        displays.forEach((display) => {
            map.set(display.id, {
                size : display.size
            })
        })

        for(let i = 0, length = displays.length; i < length; i++){
            const display = displays[i];
            const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize : display.size  });
            for (const source of sources) {
                if(source.display_id == display.id){
                    const _path = path.resolve(__dirname, `${display.id}.png`);

                    fs.writeFile(_path, source.thumbnail.toPNG(), e=>console.log);
                }
            }
        }

        const windows = [];
        for(let i = 0, length = displays.length; i < length; i++){
            const display = displays[i];

            const window = new BrowserWindow({
                x : display.bounds.x,
                y : display.bounds.y,
                width : display.size.width,
                height : display.size.height,
                //alwaysOnTop : true,
                frame : false,
                //fullscreen : true,
                //resizable : false,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    webSecurity : false
                },
            });

            window.on('ready-to-show', ()=>{
                window.setFullScreen(true)
            })

            const _path = path.resolve(__dirname, `${display.id}.png`);
            window.loadFile(`capture.html`, {query : {path:_path}});

            windows.push(window);
        }

        windows.forEach((window, idx, windows)=>{
            window.on('closed', (e)=>{
                windows[idx] = undefined;
                windows.forEach((window, idx, windows)=>{
                    if(!window){
                        return;
                    }
                    windows[idx] = undefined;
                    window.close();
                })
            });
        });
})