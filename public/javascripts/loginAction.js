document.querySelector('.img__btn').addEventListener('click', function() {
    document.querySelector('.cont').classList.toggle('s--signup');
});

let params = (new URL(document.location)).searchParams;
let name = params.get("register");
if(name=="true")
    document.querySelector('.cont').classList.toggle('s--signup');
