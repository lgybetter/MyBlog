var express = require('express');
var crypto = require('crypto') , 
User = require('../models/user.js'),
Comment = require('../models/comment.js'),
Post = require('../models/post.js');
Admin = require('../models/admin.js');
module.exports = function(app) {


  app.get('/', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成number类型
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第page页的10篇文章
    Post.getTen(null,page,function(err,posts,total) {
      if(err) {
        posts = [];
      }
      res.render('index',{
        title: '主页',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user:req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  	// Post.getAll(null,function(err,posts){
  	// 	if(err) {
  	// 		posts = [];
  	// 	}
  	// 	res.render('index', { 
   //  	title: '主页',
   //  	user: req.session.user,
   //  	posts: posts,
   //  	success: req.flash('success').toString(),
   //  	error: req.flash('error').toString() 
   //    });
  	// });
  });

  app.get('/search',function(req,res) {
    Post.search(req.query.keyword,function(err,posts) {
      if(err) {
        req.flash('error',err);
        return res.redirect('');
      }
      res.render('search',{
        title: "搜索:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', { 
    	title: '注册',
    	user: req.session.user,
    	success: req.flash('success').toString(),
    	error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
  	var name = req.body.name, password = req.body.password,password_re = req.body['password-repeat'];
  	//检验用户两次输入的密码是否一致
  	if(password_re != password) {
  		req.flash('error' , '两次输入的密码不一致！');
  		return res.redirect('/reg');//返回注册页面
  	}
  	//生成密码的md5值
  	var md5 = crypto.createHash('md5'), password = md5.update(req.body.password).digest('hex');
  	var newUser = new User({
  		name: name,
  		password: password,
  		email: req.body.email
  	});
  	//检查用户名是否已经存在
  	User.get(newUser.name,function(err,user) {
  		if(err) {
  			req.flash('error',err);
  			return res.redirect('/');
  		}
  		if(user) {
  			req.flash('error','用户已存在!');
  			return res.redirect('/reg');//返回注册页
  		}
  		//如果不存在则新增用户
  		newUser.save(function(err,user) {
  			if(err) {
  				req.flash('error',err);
  				return res.redirect('/reg');//注册失败返回注册页
  			}
  			req.session.user = user;//用户信息存入 session
		    req.flash('success', '注册成功!');
		    res.redirect('/');//注册成功后返回主页
  		});
  	});
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', { 
    	title: '登录',
    	user: req.session.user,
    	success: req.flash('success').toString(),
    	error: req.flash('error').toString() 
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
  	//生成密码的 md5 值
  	var md5 = crypto.createHash('md5'),
  	password = md5.update(req.body.password).digest('hex');
  	//检查用户是否存在
  	User.get(req.body.name,function(err,user) {
  		if(!user) {
  			req.flash('error','用户不存在!');
  			return res.redirect('/login');//用户不存在则跳转到登录页
  		}
  		//用户不存在则跳转到登录页
  		if(user.password != password) {
  			req.flash('error','密码错误!');
  			return res.redirect('/login');//用户不存在则跳转到登录页
  		}
  		//用户名密码都匹配后，将用户信息存入 session
  		req.session.user = user;
	    req.flash('success', '登陆成功!');
	    res.redirect('/');//登陆成功后跳转到主页
  	});
  });

  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    res.render('post', { 
    	title: '发表',
    	user: req.session.user,
    	success: req.flash('success').toString(),
    	error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
  	var currentUser = req.session.user,
    tags = [req.body.tag1,req.body.tag2,req.body.tag3],
    post = new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
  	post.save(function(err) {
  		if(err) {
  			req.flash('error',err);
  			return res.redirect('');
  		}
  		req.flash('success','发布成功！');
  		res.redirect('/');//发表成功跳转到主页
  	});
  });

  app.get('/logout',checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });

  app.get('/upload',checkLogin);
  app.get('/upload',function(req,res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload',checkLogin);
  app.post('/upload',function(req,res) {
    req.flash('success','文件上传成功！');
    res.redirect('/upload');
  })

  app.get('/u/:name', function(req,res) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    User.get(req.params.name,function(err,user) {
      if(!user) {
        req.flash('error','用户不存在！');
        return res.redirect('/');//用户不存在，跳转到主页
      }
      //查询并返回该用户第page页的10篇文章
      Post.getTen(user.name,page,function(err,posts,total) {
        if(err) {
          req.flash('error',err);
          return res.redirect('/');
        }
        res.render('user',{
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString() 
        });
      });
      //查询并返回该用户的所有文章
      // Post.getAll(user.name , function(err,posts) {
      //   if(err) {
      //     req.flash('error',err);
      //     return res.redirect('/');
      //   }
      //   res.render('user',{
      //     title: user.name,
      //     posts: posts,
      //     user: req.session.user,
      //     success: req.flash('success').toString(),
      //     error: req.flash('error').toString()
      //   });
      // });
    });
  });


  app.get('/p/:_id',function(req,res) {
    Post.getOne(req.params._id,function(err,post) {
      if(err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('article',{
        title: post.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/p/:_id',function(req,res) {
    var date = new Date(),
    time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
    head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var comment = {
      name: req.body.name,
      head: head,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    };
    var newComment = new Comment(req.params._id,comment);
    newComment.save(function(err) {
      if(err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','留言成功！');
      res.redirect('back');
    });
  });

  app.get('/edit/:_id',checkLogin);
  app.get('/edit/:_id',function(req,res) {
    var currentUser = req.session.user;
    Post.edit(req.params._id,function(err,post) {
      if(err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      res.render('edit',{
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:_id',checkLogin);
  app.post('/edit/:_id',function(req,res) {
    var currentUser = req.session.user;
    Post.update(req.params._id,req.body.post,function(err) {
      var url = encodeURI('/');
      if(err) {
        req.flash('error',err);
        return res.redirect(url);
      }
      req.flash('success','修改成功！');
      res.redirect(url);
    });
  });

  app.get('/remove/:_id/:name/:day/:title', checkLogin);
  app.get('/remove/:_id/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(req.params._id,currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/');
    });
  });

  app.get('/archive',function(req,res) {
    Post.getArchive(function(err,posts) {
      if(err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('archive',{
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags',function(req,res) {
    Post.getTags(function(err,posts) {
      if(err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('tags',{
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reprint/:_id',checkLogin);
  app.get('/reprint/:_id',function(req,res) {
    Post.edit(req.params._id,function(err,post) {
      if(err) {
        req.flash('error',err);
        return res.redirect(back);
      }
      var currentUser = req.session.user,
          reprint_from = {name: post.name,day: post.time.day,title: post.title},
          reprint_to = {name: currentUser.name,head: currentUser.head};
      Post.reprint(reprint_from,reprint_to,function(err,post) {
        if(err) {
          req.flash('error',err);
          return res.redirect('back');
        }
        req.flash('success','转载成功！');
        //跳转到主页
        res.redirect('/');
      });
    });
  });


  app.get('/admin',checkAdminLogin);
  app.get('/admin',function(req,res) {
    if(req.session.user != null) {
      req.session.user = null;
      req.flash('success', '用户退出!');
    }
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第page页的10篇文章
    Post.getTen(null,page,function(err,posts,total) {
      if(err) {
        posts = [];
      }
      res.render('adminIndex',{
        title: '管理员主页',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        admin:req.session.admin,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/admin/login',checkAdminNotLogin);
  app.get('/admin/login',function(req,res) {
    res.render('adminLogin', { 
      title: '管理员登录',
      admin: req.session.admin,
      success: req.flash('success').toString(),
      error: req.flash('error').toString() 
    });
  });

  app.post('/admin/login', checkAdminNotLogin);
  app.post('/admin/login', function (req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
    password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    Admin.get(req.body.name,function(err,admin) {
      if(!admin) {
        req.flash('error','管理员不存在!');
        return res.redirect('/admin/login');//用户不存在则跳转到管理员登录页
      }
      //用户不存在则跳转到管理员登录页
      if(admin.password != password) {
        req.flash('error','密码错误!');
        return res.redirect('/admin/login');//用户不存在则跳转到管理员登录页
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.admin = admin;
      req.flash('success', '登陆成功!');
      res.redirect('/admin');//登陆成功后跳转到管理员主页
    });
  });

  //app.get('/admin/reg',checkAdminLogin);
  app.get('/admin/reg', function (req, res) {
    res.render('adminReg', { 
      title: '管理员注册',
      admin: req.session.admin,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  //app.post('/admin/reg', checkAdminLogin);
  app.post('/admin/reg', function (req, res) {
    var name = req.body.name, password = req.body.password,password_re = req.body['password-repeat'];
    //检验管理员两次输入的密码是否一致
    if(password_re != password) {
      req.flash('error' , '两次输入的密码不一致！');
      return res.redirect('/admin/reg');//返回管理员注册页面
    }
    //生成密码的md5值
    var md5 = crypto.createHash('md5'), password = md5.update(req.body.password).digest('hex');
    var newAdmin = new Admin({
      name: name,
      password: password
    });
    //检查用户名是否已经存在
    Admin.get(newAdmin.name,function(err,admin) {
      if(err) {
        req.flash('error',err);
        return res.redirect('/admin');
      }
      if(admin) {
        req.flash('error','管理员已存在!');
        return res.redirect('/admin/reg');//返回注册页
      }
      //如果不存在则新增管理员
      newAdmin.save(function(err,admin) {
        if(err) {
          req.flash('error',err);
          return res.redirect('/admin/reg');//注册失败返回注册页
        }
        req.session.admin = admin;//管理员信息存入 session
        req.flash('success', '管理员注册成功!');
        res.redirect('/admin');
      });
    });
  });


  app.get('/adminLogout',checkAdminLogin);
  app.get('/adminLogout', function (req, res) {
    req.session.admin = null;
    req.flash('success', '管理员退出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });

  app.get('/a/remove/:name/:day/:title', checkAdminLogin);
  app.get('/a/remove/:name/:day/:title', function (req, res) {
    Post.remove(req.params.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/admin');
    });
  });

  app.get('/admin/Users',checkAdminLogin);
  app.get('/admin/Users',function(req,res) {
    User.getAll(null,function(err,users) {
      if(err) {
        users = [];
      }
      res.render('adminUser',{
        title: '管理员主页',
        users: users,
        admin: req.session.admin,
        success:req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  ///a/remove/<%= user.name %>
  app.get('/a/remove/:name',checkAdminLogin);
  app.get('/a/remove/:name',function(req,res) {
    User.remove(req.params.name,function(err) {
      if(err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','删除成功');
      res.redirect('/admin/Users');
    });
  });

  app.get('/nswbmw', function (req, res) {
    res.send('hello,world!');
  });

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!'); 
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录!'); 
      res.redirect('back');
    }
    next();
  }

  function checkAdminLogin(req,res,next) {
    if(!req.session.admin) {
      req.flash('error','管理员未登录！');
      res.redirect('/admin/login');
    }
    next();
  }

  function checkAdminNotLogin(req,res,next) {
    if(req.session.admin) {
      req.flash('error','管理员已登录！');
      res.redirect('back');
    }
    next();
  }
};
