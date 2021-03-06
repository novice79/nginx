
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
    mounted: function () {
        this.token = sessionStorage.getItem("token");
    },
    data: {
        user_name: '',
        password: '',
        token: '',
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
        login: function () {
            const user_name = this.user_name;
            const password = this.password;
            this.user_name = this.password = '';
            sock.emit('login', {
                user_name,
                password
            }, res=>{
                if(res.ret == 0){
                    sessionStorage.setItem('token', res.token);
                    this.token = res.token;
                } else {
                    alert('登陆失败');
                }
            });            
        },
        req_cert: function () {
            if (!this.domain || !this.email) {
                alert('域名或邮箱不能为空');
            } else {
                sock.emit('req-cert', {
                    token: this.token,
                    domain: this.domain,
                    email: this.email
                })
            }
        },
        bind_svr: function () {
            const svr_domain = this.svr_domain.trim() || 'default';
            if(this.protocol == 'https' && this.certs.indexOf(svr_domain) < 0){
                return log(`尚未申请${svr_domain}证书，不能绑定https服务`);           
            }
            this.inner_svr.trim();
            if(!this.inner_svr){
                return log('请填写内部服务地址');
            }
            if(this.inner_svr[0] === '/' && this.inner_svr[this.inner_svr.length -1] != '/'){
                this.inner_svr += '/';
            }
            let svr_path = this.svr_path || '/';
            if(svr_path[0] != '/') svr_path = '/' + svr_path;
            if(svr_path[svr_path.length -1] != '/') svr_path += '/';
            sock.emit('bind-service', {
                token: this.token,
                protocol: this.protocol,
                svr_domain,
                svr_path,
                inner_svr: this.inner_svr,
            })
        },
        del_svr: function (addr) {
            sock.emit('del-service', {
                token: this.token,
                addr
            });
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
