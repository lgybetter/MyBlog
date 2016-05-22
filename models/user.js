var mongodb = require('./db.js');
var Post = require('./post.js');
var crypto = require('crypto');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

User.prototype.save = function(callback) {
	var md5 = crypto.createHash('md5'),email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
	head ="http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
	//要存入数据库的用户文档
	var user = {
		name: this.name,
		password: this.password,
		email: this.email,
		head: head
	};
	//打开数据库
	mongodb.open(function(err,db) {
		if(err) {
			return callback(err);//错误，返回err信息
		}
		//读取 users集合
		db.collection('users' , function(err,collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//将用户数据插入users集合
			collection.insert(user ,{
				safe: true
			}, function(err,user) {
				mongodb.close();
				if(err) {
					return callback(err);//错误，返回err信息
				}
				callback(null , user[0]);//成功 ，err为null，并返回存储后的用户文档
			});
		});
	});
};

User.get = function(name ,callback) {
	//打开数据库
	mongodb.open(function(err,db) {
		if(err) {
			return callback(err);//错误，返回err信息
		}
		//读取users集合
		db.collection('users' , function(err , collection) {
			if(err) {
				mongodb.close();
				return callback(err);//错误，返回err信息
			}
			//查找用户名（name键）值为name的一个文档
			collection.findOne({
				name: name
			},function(err,user) {
				mongodb.close();
				if(err) {
					return callback(err);//失败，返回err信息
				}
				callback(null,user);//成功，返回查询的用户信息
			});
		});
	});
};

User.getAll = function(name,callback) {
	//打开数据库
	mongodb.open(function(err,db) {
		if(err) {
			mongodb.close();
			return callback(err);
		}
		//读取users 集合
		db.collection('users',function(err,collection) {
			if(err) {
				mongodb.close();
				return callback(err);//错误，返回err信息
			}
			var query = {};
			if(name) {
				query.name = name;
			}
			//根据qurey对象查询用户
			collection.find(query).sort({
				name: -1
			}).toArray(function(err,users) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null,users);
			});
		});
	});
}

User.remove = function(name,callback) {
	mongodb.open(function(err,db) {
		if(err) {
			return callback(err);
		}
		db.collection('users',function(err,collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			collection.remove({
				"name":name
			},{
				w:1
			},function(err) {
				// Post.remove(name,null,null,function(err) {
				// 	if(err) {
				// 		callback(err);
				// 	}
				// 	callback(null)
				// });
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

// Post.remove = function(name,day,title,callback) {
//   mongodb.open(function(err,db) {
//     if(err) {
//       return callback(err);
//     }
//     db.collection('posts',function(err,collection) {
//       if(err) {
//         mongodb.close();
//         return callback(err);
//       }

//       collection.remove({
//         "name": name,
//         "time.day": day,
//         "title": title
//       }, {
//         w:1
//       },function(err) {
//         mongodb.close();
//         if(err) {
//           return callback(err);
//         }
//         callback(null);
//       });
//     });
//   });
// };

