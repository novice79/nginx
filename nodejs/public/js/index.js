
const sock = io('', {path: '/socket.io'});
sock.on('connect', function (data) {
    console.log('connect to socket.io server')
});
sock.on('hello', function (data) {
    console.log('hello from server', data)
    sock.emit('world', 'world from client')
});
function test_post() {
    $.ajax({
        type: "POST",
        url: '/ajax_relay',
        timeout: 3000,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            url: 'http://ny.cninone.com/index.php?route=api/equipment',
            data: {

            }
        }),
        dataType: "json"
    }).done((resp) => {
        console.log('success', resp);
    }).fail((err) => {
        console.log('failed: ', err);
    })
}

function log(str) {
    $(".logs").prepend(`${moment().format("YYYY-MM-DD HH:mm:ss")}: <i>${str}</i><br>`);
}
