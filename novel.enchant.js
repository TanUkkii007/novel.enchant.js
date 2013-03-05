/**
 * novel.enchant.js
 * Released under the MIT license.
 * 
 *
 * @fileOverview
 * novel.enchant.js
 * @require enchant.js
 * @author Yusuke Yasuda
 *
 * @description
 * An unofficial novel engine for enchant.js of Ubiquitous Entertainment Inc. (http://enchantjs.com)
 *
 * @detail
 *
 * 
 * 
 *
 */



(function(window) {

/**
 * import enchant
 */
var enchant = window.enchant;

/**
 * generate GUID.
 * extracted from "JavaScript Web Applications" by Alex MacCaw, O'Reilly.
 */
Math.guid = function(){
             return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
                 var r = Math.random()*16 | 0;
                 var v = (c == 'x')? r: (r&0x3|0x8);
                 return v.toString(16);
             }).toUpperCase();
         };



/**
 * ORM
 * 
 */
var Model = {
    inherited: function(){},
    created: function(){},
    prototype: {
        init: function(){}
    },
    
 /**
 * Create a Model.
 *
 *
 * @example
 *
 * @static
 */
    create: function(){
        var object = Object.create(this);
        object.parent = this;
        object.fn = object.prototype;
        object.created();
        this.inherited(object);
        return object;
    },
    init: function(){
        var instance = Object.create(this.prototype);
        instance.parent = this;
        instance.init.apply(instance, arguments);
        return instance;
    },
    extend: function(obj) {
        var extended = obj.extended;
        for (var i in obj) {
            this[i] = obj[i];
        }
        if (extended) {
            extended(this);
        }
    },
    include: function(obj) {
        var included = obj.included;
        for (var i in obj) {
            this.prototype[i] = obj[i];
        }
        if (included) {
            included(this.prototype);
        }
    }
};
           
Model.include({
    init: function(atts){if (atts) this.load(atts)},
    load: function(attribute){for (var name in attribute) this[name] = attribute[name]}
});

Model.recordAddress = {};
Model.include({
    newRecord: true,

             create: function(name){
                 //this.records = {};
                 if (!this.id) this.id = Math.guid();
                 this.newRecord = false;
                 this.parent.records[this.id] = this;
                 this.parent.recordAddress[name] = this.id;
             },
             destroy: function(){
                 delete this.parent.records[this.id];
             },
             update: function(){
                 this.parent.records[this.id] = this.dup();
             },
             save: function(name){
                 this.newRecord ? this.create(name) : this.update();
             },
             dup: function(){
                 var obj = {};
                 Model.extend.call(obj, this);
                 return obj;
             }
});

Model.extend({
    find: function(id) {
    var record = this.records[id];
    if (!record) {throw 'Not Available';}
    return record.dup();
}});
   

         
Model.extend({
             populate: function(values){
                 this.records = {};
                 var record = this.init(values);
                 if (!record.id) record.id = Math.guid();
                 record.newRecord = false;
                 this.records[record.id] = record;
                 return record.id;
             }
});
         
Model.extend({
             created: function(){
                 this.records = {};
                 this.attributes = [];
             }
});
//attributesとtoJSONはModel.LocalStorageに統一すべき
Model.include({
             attributes: function(){
                 var result = {};
                 for (var i in this.parent.attributes) {
                     var attr = this.parent.attributes[i];
                     result[attr] = this[attr];
                 }
                 result.id = this.id;
                 return result;
             }
});

Model.include({
             toJSON: function(){
                 return (this.attributes());
             }
});

Model.extend({
    recordAddress: {},
    setRecordAddress: function(name, id) {
        this.recordAddress[name] = id;
    },
    getId: function(name) {
        return this.recordAddress[name];
    }
});

/**
 *Module for Model that handle localStorage.
 */
Model.LocalStorage = {
             saveLocal: function(name){
                 var result = [];
                 for (var i in this.records) {
                     result.push(this.records[i]);
                 }
                 if (result.length === 1) {
                     result = result[0];
                 }
                 localStorage[name] = JSON.stringify(result);
             },
             loadLocal: function(name){
                 var result = JSON.parse(localStorage[name]);
                 this.populate(result);
                 var id = this.populate(result);
                 this.setRecordAddress(name, id);
             }
};

/**
 *Module for Model that handle JSON file data
 */
Model.File = {
    setDir: function(dirname) {
        this.dirname = dirname;
    },
    /*
    setAttributes: function() {
        if (arguments instanceof Array) {
            this.attributes = arguments;
        } else {
            this.attributes = Array.prototype.slice.call(arguments);
        }
    },
    */
   
    /** 
    * Load JSON file and save parsed data.
    * @param {String} name JSON file name without directory name and ".json"
    * @param {Function} [callback]
    */
    loadJSON: function(name, callback) {
        var self = this;
        var filename = this.dirname + name + '.json';
        var req = new XMLHttpRequest();
        req.open('GET', filename, true);
        req.onreadystatechange = function(e) {
            if (req.readyState === 4) {
                if (req.status !== 200 && req.status !== 0) {
                    throw new Error(req.status + ': ' + 'Cannot load a file: ' + filename);
                }
            var result = JSON.parse(req.responseText);
            var id = self.populate(result);
            self.setRecordAddress(name, id);
            if (callback) callback();    
            }
        };
        req.send(null);
    }
};

var MyClass = function(parent) {
    var klass = function() {
    this.initialize.apply(this, arguments);
    };
    if (parent) {
    var subclass = function(){};
    subclass.prototype = parent.prototype;
    klass.prototype = new subclass;
    }
    klass.prototype.initialize = function(){};
               
               klass.fn = klass.prototype;
               klass.fn.parent = klass;
               klass._super = Object.getPrototypeOf(klass);
               
               klass.proxy = function(func){
                   var self = this;
                   return (function(){
                       return func.apply(self, arguments);
                   });
               }
               klass.fn.proxy = klass.proxy;
               
               klass.extend = function(obj) {
                   var extended = obj.extended;
                   for (var i in obj) {
                       klass[i] = obj[i];
                   }
                   if (extended) {
                       extended(klass);
                   }
               }
               
               klass.include = function(obj) {
                   var included = obj.included;
                   for (var i in obj) {
                       klass.fn[i] = obj[i];
                   }
                   if (included) {
                       included(klass);
                   }
               }
               return klass;
};


var StateMachine = new MyClass(enchant.EventTarget);
StateMachine.include({
    initialize: function() {
        enchant.EventTarget.call(this);
    },
    add: function(controller) {
        this.addEventListener('novel_switch_mode', function(e) {
            if (controller === e.currentMode) {
                controller.activate();
            } else {
                controller.deactivate();
            }
        });
        
        controller.active = this.proxy(function() {
            var event = new enchant.Event('novel_switch_mode');
            event.currentMode = controller;
            this.dispatchEvent(event);
        });
    }
});



/*
(function(global) {
    var Router = new MyClass;
    Router.extend({
        _hash: '',
        definition: {},
        capture: [],
        getHash: function() {
            return this._hash;
        },
        setHash: function() {
            this._hash = global.location.hash;
        },
        register: function() {
            global.onhashchange = function() {
                this.setHash();
                this.resolve();
            };
        },
        redirect: function(route) {
            global.location.hash = route;
        },
        resolve: function() {
            for (var route in this.definition) {
                var regexp = this.routeToRegExp(route);
                var match = this._hash.match(regexp);
                if (match) {
                    return this.definition[route];
                }
            }
            throw new Error('定義されたどのルートにもマッチしません');
        },
        routeToRegExp: function(route) {
            route = route.replace(/:(\w+)/g, function(all, capture){
                    this.capture.push(capture);
                    return '(\w+)';
            });
            return new RegExp('^' + route + '$');
        }
    });
    
    global.Router = Router;
})(window)
*/










enchant.Event.NOVEL_CHANGE_SCENE = 'novel_scene_changed';
enchant.Event.NOVEL_CHANGE_ROUTE = 'novel_route_changed';
enchant.Event.NOVEL_END_OF_ROUTE = 'novel_end_of_route';
enchant.Event.NOVEL_SCRIPT_INDEX_CHANGED = 'novel_script_index_changed';
enchant.Event.NOVEL_END_OF_SHOW = 'novel_end_of_show_t';





var Novel =  enchant.Class.create(enchant.Scene,{
    /**
    * ノベルゲーム用Sceneオブジェクトを作成する
    * @class A class that generates a scene for a novel game.
    * 
    * @param {Object} about
    * @extends {enchant.Scene}
    * 
    * @constructs
    */
    initialize: function(about) {
        enchant.Scene.call(this);
        if (!about.sceneName) {
            throw new Error('please set a "sceneName" property in this argument object.');
        }
        this.sounds = {};
        this.images = {};
        
        this.config = {
            timingEvents: {
                'novel_start_of_show_t': 's',
                'novel_end_of_show_t': 'e'
            }
        };
        this.config.isFile = about.isFile || true;
        this.config.skipSpeed = about.skipSpeed || 5;
        this.config.reverseSpeed = about.reverseSpeed || 5;
        
        this.scene = (function(self) {
            
            var sceneName = about.sceneName || '';
            var routeName = about.routeName || 'init';
            
            return {
                /** 
                 * Set scene name 
                 * @param {String} name 
                 */
                setSceneName: function(name) {
                    sceneName = name;
                    self.triggerEvent('novel_scene_changed');
                },
                getSceneName: function() {
                    return sceneName;
                },
                setRouteName: function(name) {
                    routeName = name;
                    self.triggerEvent('novel_route_changed');
                },
                getRouteName: function() {
                    return routeName;
                }
            };
        }(this));
        var sceneName = this.scene.getSceneName();
        var routeName = this.scene.getRouteName();

        this.Script = Model.create();
        this.Script.extend(Model.File);
        
        var setIterator = function() {
            var self = this;
            var temp = {};
            var iterator = (function(enchant){
            var index = about.index || -1;
            var id = self.Script.getId(self.scene.getSceneName());
            var script = self.Script.records[id][sceneName][routeName];
            
            var length = script.length;
            
            var checkAssets = function() {
                if (typeof script[index] !== 'object') {
                    return true;
                } else {
                    var image, sound, scr = script[index];
                    temp.images = {};
                    temp.sounds = {};
                    for (var key in scr) {
                        if (key == 'text') {
                            temp.text = scr[key];
                        } else
                        if (!scr[key]) {
                            if (self.images[key]) {
                                self.removeChild(self.images[key]);
                                delete self.images[key];
                            } else
                            if (self.sounds[key]) {
                                self.sounds[key].stop();
                                delete self.sounds[key];
                            }                            
                        } else
                        if ((image = enchant.Core.instance.assets[scr[key].name]) instanceof enchant.Surface) {
                            var sprite = {};
                            var beforeNode;
                            if (beforeNode = self.images[key]) {
                                sprite = new Sprite(beforeNode.width, beforeNode.height);
                                sprite.beforeNode = beforeNode;
                                var attribute = ['x', 'y', 'backgroundColor', 'opacity', 'visible', 'touchEnabled', 'scaleX', 'scaleY', 'rotation', 'originX', 'originY'];
                                for (var i in attribute) {
                                    if (beforeNode[attribute[i]]) {
                                        sprite[attribute[i]] = beforeNode[attribute[i]];
                                    }
                                }
                            } else {
                                sprite = new Sprite(scr[key].width, scr[key].height);
                            }
                            
                            for (var attr in scr[key]) {
                                sprite[attr] = scr[key][attr];
                            }
                            sprite.image = image;
                            //sprite.x = 0;
                            //sprite.y = 0;
                            self.images[key] = temp.images[key] = sprite;
                        } else
                        if ((sound = enchant.Core.instance.assets[scr[key]]) instanceof enchant.Sound) {
                            self.sounds[key] = temp.sounds[key] = sound.clone();
                        } else
                        if (key == 'callbacks') {
                            temp.callbacks = scr[key];
                        }
                    }
                }
            };
            
            return {
                current: function() {
                    if (this.hasCurrent()) {
                        var obj = {};
                        if (checkAssets()) {
                            obj.text = script[index];
                        } else {
                            obj = temp;
                        }
                        return obj;
                    }
                },
                next: function() {
                    if (!this.hasNext()) {
                        self.triggerEvent('novel_end_of_route');
                        return null;
                    }
                    index++;
                    self.triggerEvent('novel_script_index_changed');
                    if (!this.hasNext()) {
                        self.triggerEvent('novel_no_next');
                    }
                    if (this.hasCurrent()) {
                        var obj = {};
                        if (checkAssets()) {
                            obj.text = script[index];
                        } else {
                            obj = temp;
                        }
                        
                        return obj;
                    }
                    
                },
                hasNext: function() {
                    return (index < length - 1);
                },
                hasCurrent: function() {
                    return (index <= length - 1);
                },
                previous: function() {
                    if (!this.hasPrevious()) {
                        return null;
                    }
                    index--;
                    self.triggerEvent('novel_script_index_changed');
                    var obj = {};
                    if (checkAssets()) {
                        obj.text = script[index];
                    } else {
                        obj = temp;
                    }

                    return obj;
                },
                hasPrevious: function() {
                    return (index > 0);
                },
                index: function() {
                    return index;
                },
                rewind: function() {
                    index = -1;
                    self.triggerEvent('novel_script_index_changed');
                },
                indexTo: function(num) {
                    if (num > 0 && num < length) {
                        index = num;
                        return true;
                    }
                    return false;
                },
                refreshScript: function(index) {
                    id = self.Script.getId(self.scene.getSceneName());
                    sceneName = self.scene.getSceneName();
                    routeName = self.scene.getRouteName();
                    script = self.Script.records[id][sceneName][routeName];
                    length = script.length;
                    if (index) {
                        var isSuccess = self.Script.indexTo(index);
                    }
                    if (!index || !isSuccess) {
                        self.Script.rewind();
                    }
                }
            };
        }(enchant))
        self.Script.extend(iterator);
        
        self.label.add();
        self.show();
        };
        
        this.Script.setDir('scripts/');
        //this.Script.setAttributes(name);
        //this.Script.loadJSON(name, this.addScript.bind(this));
        
        if (this.config.isFile) {
            this.Script.loadJSON(sceneName, setIterator.bind(this));
        }
        
        this.variables = {};
        
       
        this.label = (function(self) {
            var label = new Label('');
            label.x = 10;
            label.y = 260;
            label.color = '#ffffff';
            return {
                   setLabel: function(settings) {
                       for (var i in settings) {
                           label[i] = settings[i];
                       }
                   },
                   getLabel: function() {
                       return label;
                   },
                   setText: function(text) {
                       self.label.clear();
                       label.text = text;
                   },
                   add: function() {
                       self.addChild(label);
                   },
                   addLabel: function(text) {
                       self.label.add();
                       self.label.setText(text);
                       self.label.addLabel = function(text) {
                           self.label.setText(text);
                       }
                   },
                   clear: function() {
                       label.text = '';
                   }
            }
        }(this));
        
        
        this.switchMode = new StateMachine;
        (function(self) {
        var skip = {
            activate: function() {
                self.addEventListener('novel_skip_frame', self.show);
            },
            deactivate: function() {
                self.removeEventListener('novel_skip_frame', self.show);
            }
        };
        var auto = {
            activate: function() {
                self.addEventListener('novel_auto_frame', self.show);
            },
            deactivate: function() {
                self.removeEventListener('novel_auto_frame', self.show);
            }
        };
        var rewind = {
            activate: function() {
                //self.addEventListener('novel_skip_frame', self.show);
            },
            deactivate: function() {
                //self.removeEventListener('novel_skip_frame', self.show);
            }
        };
        var stop = {
            activate: function() {},
            deactivate: function() {}
        };
        self.switchMode.add(skip);
        self.switchMode.add(auto);
        self.switchMode.add(rewind);
        self.switchMode.add(stop);
        stop.active();
        self.switchMode.skip = function() {
            skip.active();
        };
        self.switchMode.auto = function() {
            auto.active();
        };
        self.switchMode.rewind = function() {
            rewind.active();
        };
        self.switchMode.stop = function() {
            stop.active();
        };
        }(this));
        
        
        this.localStorage = Model.create();
        this.localStorage.extend(Model.LocalStorage);
        this.localStorage.attributes = ['sceneName', 'routeName', 'index', 'date'];
        (function(self) {
            self.localStorage.save = function(dataindex) {
                var info = {};
                info.sceneName = self.scene.getSceneName();
                info.routeName = self.scene.getRouteName();
                info.index = self.Script.index();
                info.date = new Date();
                
                var data = this.init(info);
                data.save();
                this.saveLocal('n' + dataindex);
            };
            self.localStorage.load = function(dataindex) {
                this.loadLocal('n' + dataindex);
            };
            self.localStorage.setScript = function(dataindex) {
                var id = this.recordAddress['n' + dataindex];
                if (!id) {
                    throw new Error('No data in the *dataindex*: n' + dataindex);
                }
                var scene = this.records[id]['sceneName'];
                var route = this.records[id]['routeName'];
                var index = this.records[id]['index'];
                self.scene.setSceneName(scene);
                self.scene.setRouteName(route);
                self.Script.refreshScript(index);
            };
        }(this));
        
        
        
        
        this.backgroundColor = "#000000";
        
        this.setPromptIcon();
        
        this.eventPool = {};
        
        this.addEventListener('touchend', function(e){
	    this.show();
        });
        
        this.addEventListener('novel_end_of_show_t', function(e){
            this.triggerTimingEvents(e);
	    this.eventPool = {};
        });
        this.addEventListener('novel_start_of_show_t', function(e){
	    this.triggerTimingEvents(e);
        });
        
        this.addEventListener('enterframe', function(e){
            var self = this;
	        if (!(enchant.Core.instance.frame % (this.config.skipSpeed || 3))) {
                    self.dispatchEvent(new enchant.Event('novel_skip_frame'));
                }
                if (!(enchant.Core.instance.frame % (this.config.autoSpeed || 40))) {
                    self.dispatchEvent(new enchant.Event('novel_auto_frame'));
                }
        });
        
        
    },
    setPromptIcon: function() {
        this.promptIcon = new Sprite(16,16);
        this.promptIcon.image = enchant.Core.instance.assets["imgs/icon0.gif"];
        this.promptIcon.x = 300;
        this.promptIcon.y = 300;
        this.promptIcon.frame = 4 * 16 + 7;
        this.addChild(this.promptIcon);
        this.promptIcon.addEventListener('enterframe',function(e){
            if(enchant.Core.instance.frame % 10 == 0) {
                this.y = -this.y-100;
            }
        });
    },
    /**
    * 
    * Replace tokens {{VARIABLE_NAME}} in text by the value with key: "VARIABLE_NAME" in this.variables.
    * @param {String} text The text that might have the token "{{VARIABLE_NAME}}".
    */
    expandVariables: function(text) {
       var pattern = /{{[^\W\\d]+\w+}}/gm;
       var matches = text.match(pattern);
       if (!matches) return text;
       for (var i in matches) {
           for (var name in this.variables) {
               var token = '{{' + name + '}}';
               if (token === matches[i]) {
                   text = text.replace(token, this.variables[name]);
               }
           }
       }
       return text;
    },
    
    setVariables: function(variables) {
       for (var name in variables) {
           this.variables[name] = variables[name];
       }
    },
    /** 
    * show images, sounds, texts on screen.
    * every *touchend* event call this method.
    */
    show: function() {
        var obj = this.Script.next();
        this.dispatchEvent(new Event('novel_start_of_show_t'));
        
        if (obj !== null) {
            var text = obj.text;
            text = this.expandVariables(text);
            this.label.setText(text);
            
            if (obj.images) {
                for (var img in obj.images) {
                    if (obj.images[img].beforeNode) {
                        this.insertBefore(obj.images[img], obj.images[img].beforeNode);
                        this.removeChild(obj.images[img].beforeNode);
                    } else {
                        
                        this.addChild(obj.images[img]);
                    }
                }
            }
            
            if (obj.sounds) {
                for (var se in obj.sounds) {
                    obj.sounds[se].play();
                }
            }
        }
        this.dispatchEvent(new Event('novel_end_of_show_t'));
    },
    triggerEvent: function(type) {
        var event =  new Event(type);
        event.scene = this.scene.getSceneName();
        event.route = this.scene.getRouteName();
        event.index = this.Script.index();
        this.eventPool[type] = event;
        this.dispatchEvent(event);
    },
    triggerTimingEvents: function(timing_event) {
        var type = timing_event.type;
        var suffix = this.config.timingEvents[type];
        var events;
        if (events = this.eventPool) {
            for (type in events) {
                type = type + '_' + suffix;
                this.dispatchEvent(new Event(type));
            }
        }
    },
    /**
    * Add a new event listener which will be executed *just one time*.
    * When the event is dispatched, the listener is then removed immediately.
    * @param {String} type Type of the events.
    * @param {function(e:enchant.Event)} listener Event listener to be added.
    */
    addEventListenerOnce: function(type, listener) {
        var id = Math.guid();
        var callback = function() {
            listener();
            this.removeEventListener(type, callback);
            delete this.addEventListenerOnce[callback.id];
        }
        callback.id = id;
        this.addEventListenerOnce[id] = callback.id;
        
        this.addEventListener(type, callback);
    }/*,
    skip: function() {
        var self = this;
        this.addEventListener('enterframe', function(e){
	    if (enchant.Core.instance.frame % (this.config.skipSpeed || 5)) {
                self.dispatchEvent('novel_skip_frame');
            }
        });
        var listener = function() {
            this.show();
        };
        this.addEventListener('novel_skip_frame', listener);
    }
    */
    
    
});

Novel.localStorage = Model.create();
Novel.localStorage.extend(Model.LocalStorage);
Novel.localStorage.attributes = ['sceneName', 'routeName', 'index', 'date'];
Novel.localStorage.load = function(dataindex) {
    this.loadLocal('n' + dataindex);
};
Novel.localStorage.loadAll = function() {
    for (var i in localStorage) {
        if (this.validate(i)) {
            this.loadLocal(i);
        }
    }
};
Novel.localStorage.findFromIndex = function(dataindex) {
    var id = this.getId('n' + dataindex);
    return this.records[id];
};
Novel.localStorage.findAll = function() {
    var data = {};
    for (var i in this.records) {
            data[i] = this.find(i);
    }
    return data;
};
Novel.localStorage.validate = function(target) {
    var pattern = /^n\d+$/;
    var bool = pattern.test(target);
    return bool;
};
Novel.localStorage.isExists = function() {
    var data = [];
    for (var i in localStorage) {
        if (this.validate(i)) {
            data.push(i);
        }
    }
    return data.length;
};

/**
 * export Novel
 */    
window.enchant.Novel = Novel;

}(window))
