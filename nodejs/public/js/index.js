
const sock = io('', { path: '/socket.io' });
sock.on('connect', function (data) {
    console.log('connect to socket.io server')
});
sock.on('le-feedback', function (data) {
    log(data)
});
sock.on('svr-back', function (data) {
    log(data)
});
sock.on('exist-certs', function (data) {
    vm.$emit('exist-certs', data);
});
sock.on('exist-svrs', function (data) {
    vm.$emit('exist-svrs', data);
});
var vm = new Vue({
    el: '.content',
    created: function () {
        this.$root.$on("exist-certs", data => {
            this.certs = data
        });
        this.$root.$on("exist-svrs", data => {
            this.svrs = data
        });
    },
    data: {
        protocol: 'http',
        domain: '',
        email: '',
        certs: [],
        svrs: {},
        svr_domain: '',
        svr_path: '',
        inner_svr: '',
    },
    methods: {
        req_cert: function () {
            if (!this.domain || !this.email) {
                alert('域名或邮箱不能为空');
            } else {
                sock.emit('req-cert', {
                    domain: this.domain,
                    email: this.email
                })
            }
        },
        bind_svr: function () {
            if(!this.inner_svr){
                return log('请填写内部服务地址');
            }
            let svr_path = this.svr_path || '/';
            if(svr_path[0] != '/') svr_path = '/' + svr_path;
            if(svr_path[svr_path.length -1] != '/') svr_path += '/';
            sock.emit('bind-service', {
                protocol: this.protocol,
                svr_domain: this.svr_domain.trim() || 'default',
                svr_path,
                inner_svr: this.inner_svr,
            })
        },
        del_svr: function (addr) {
            sock.emit('del-service', {addr});
        }
    }
})
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
