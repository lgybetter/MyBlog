var mongodb = require('./db.js');
var ObjectID = require('mongodb').ObjectID;
function Comment(_id, comment) {
	this._id = _id;
	this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function (callback) {
	var _id = this._id, comment = this.comment;
	//打开数据库
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.authenticate('user', 'lgylgy', (err, result) => {
			//读取posts集合
			db.collection('posts', function (err, collection) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				//通过_id查找文档，并把一条留言对象添加到该文档的 comments 数组里
				collection.update({
					"_id": new ObjectID(_id)
				}, {
						$push: { "comments": comment }
					}, function (err) {
						mongodb.close();
						if (err) {
							return callback(err);
						}
						callback(null);
					});
			});
		})

	});
};