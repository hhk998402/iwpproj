var mongoose   =  require("mongoose");

var clubSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.ObjectId, auto: true},
    name : {type:String,required:true},
    email : {type : String,required : true,lowercase :true, unique:true},
    passwd : {type: String, required:true},
    authCode: {type:String},
    club: {type:String, required:true},
    authComp: {type:Boolean, default:false},
    authCheck: {type:String},
    members: {type:Number}
});

var club = mongoose.model("club",clubSchema);

module.exports = club;
