var mongoose   =  require("mongoose");

var memberSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.ObjectId, auto: true},
    name : {type:String,required:true},
    email : {type : String,required : true,lowercase :true, unique:true},
    passwd : {type: String, required:true},
    authCode: {type:String},
    regNo: {type:String},
    authComp: {type:Boolean, default:false},
    authCheck: {type:String},
    timeTableUploaded: {type:Boolean, default:false},
    clubs: {type:Array,default:[]}
});

var member = mongoose.model("members",memberSchema);

module.exports = member;
