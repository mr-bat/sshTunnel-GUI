const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let tnl = false

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})
  if (tnl === false) {
    tnl = true;
    let socks = require('socksv5'),
        Client = require('ssh2').Client;
    let config = {
        //The socks5 proxy will listen on host:port
        localProxy: {
            host: '127.0.0.1',
            port: 1234
        },
        //Settings used to connect remote SSH server.
        sshConfig: {
            host: '198.199.124.75',
            port: 22,
            username: 'root',
            privateKey: require('fs').readFileSync(`${require('os').homedir()}/.ssh/id_rsa`),
            // passphrase: 'your_as_long_as_cat_passphrase_to_the_private_key'
        }
        // Password only authentication example:
        // sshConfig: {
        //     host: 'remote.domain.name.or.ip.address',
        //     port: 22,
        //     username: 'username',
        //     password: 'password'
        // }
    }

    socks.createServer(function(info, accept, deny) {
        var conn = new Client();
        conn.on('ready', function() {
            conn.forwardOut(info.srcAddr,
                info.srcPort,
                info.dstAddr,
                info.dstPort,
                function(err, stream) {
                    if (err) {
                        conn.end();
                        return deny();
                    }

                    var clientSocket;
                    if (clientSocket = accept(true)) {
                        stream.pipe(clientSocket).pipe(stream).on('close', function() {
                            conn.end();
                        });
                    } else
                        conn.end();
                });
        }).on('error', function(err) {
            deny();
        }).connect(config.sshConfig);
    }).listen(config.localProxy.port, config.localProxy.host, function() {
        console.log('SOCKSv5 proxy server started on ' + config.localProxy.host + ':' + config.localProxy.port);
        mainWindow.loadURL(url.format({
          pathname: path.join(__dirname, 'index.html'),
          protocol: 'file:',
          slashes: true
        }))
    }).useAuth(socks.auth.None());
  }
  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
