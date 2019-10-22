/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and  non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
"use strict";

cc.Audio = function (src) {
    this.src = src;
    this.volume = 1;
    this.loop = false;
    this.id = -1;
};

cc.AudioEngine = {};

cc.AudioEngine.AudioState = {
    ERROR: -1,
    INITIALZING: 0,
    PLAYING: 1,
    PAUSED: 2,
    STOPPED: 3,
};

(function (proto) {

    function playInnerAudio(src, loop, volume) {
        var innerAudio = qg.createInnerAudioContext();
        innerAudio.state = cc.AudioEngine.AudioState.PLAYING;
        innerAudio.src = "" + src;
        innerAudio.loop = loop;
        innerAudio.volume = volume;
        innerAudio.play();
        return innerAudio;
    }

    // Using the new audioEngine
    cc.audioEngine = {};

    cc.audioEngine.setMaxWebAudioSize = function () { };
    cc.audioEngine.audios = [];

    cc.Audio.State = cc.AudioEngine.AudioState;

    proto.play = function () {
        var clip = this.src;
        if (typeof this.volume !== 'number') {
            this.volume = 1;
        }
        var path;
        if (typeof clip === 'string') {
            // backward compatibility since 1.10
            cc.warnID(8401, 'cc.audioEngine', 'cc.AudioClip', 'AudioClip', 'cc.AudioClip', 'audio');
            path = clip;
            var md5Pipe = cc.loader.md5Pipe;
            if (md5Pipe) {
                path = md5Pipe.transformURL(path);
            }
        }
        else {
            if (!clip) {
                return;
            }
            path = clip._nativeAsset;
        }
        var innerAudio = playInnerAudio(path, this.loop, this.volume);
        this.id = innerAudio;
        return innerAudio;
    };

    proto.pause = function () {
        if (this.id != -1) {
            this.id.state = cc.AudioEngine.AudioState.PAUSED;
            this.id.pause();
        }
    };

    proto.resume = function () {
        if (this.id != -1) {
            this.id.state = cc.AudioEngine.AudioState.PLAYING;
            this.id.play();
        }
    };

    proto.stop = function () {
        if (this.id != -1) {
            this.id.state = cc.AudioEngine.AudioState.STOPPED;
            this.id.stop();
            this.id = -1;
        }
    };

    proto.destroy = function () {

    };

    proto.setLoop = function (loop) {
        this.loop = loop;
        if (this.id != -1) {
            this.id.loop = loop;
        }
    };

    proto.getLoop = function () {
        return this.loop;
    };

    proto.setVolume = function (volume) {
        this.volume = volume;
        if (this.id != -1) {
            this.id.volume = volume;
        }
    };

    proto.getVolume = function () {
        return this.volume;
    };

    proto.setCurrentTime = function (time) {
        if (this.id != -1) {
            this.id.seek(time);
        }
    };

    proto.getCurrentTime = function () {
        if (this.id != -1) {
            return new Number(this.id.currentTime);
        }
        return new Number(0);
    };

    proto.getDuration = function () {
        if (this.id != -1) {
            return new Number(this.id.duration);
        }
        return new Number(0);
    };

    proto.getState = function () {
        if (this.id != -1 && this.id.currentTime <= this.id.duration) {
            return this.id.state;
        }
        return cc.AudioEngine.AudioState.ERROR;
    };

    proto.setFinishCallback = function (id, callback) {
        if (this.id != -1) {
            this.id.onEnded(callback)
        }
    }

    // polyfill audioEngine

    var _music = {
        id: -1,
        clip: '',
        loop: false,
        volume: 1
    };
    var _effect = {
        volume: 1
    };

    cc.audioEngine.play = function (clip, loop, volume) {
        if (typeof volume !== 'number') {
            volume = 1;
        }
        var path;
        if (typeof clip === 'string') {
            // backward compatibility since 1.10
            cc.warnID(8401, 'cc.audioEngine', 'cc.AudioClip', 'AudioClip', 'cc.AudioClip', 'audio');
            path = clip;
            var md5Pipe = cc.loader.md5Pipe;
            if (md5Pipe) {
                path = md5Pipe.transformURL(path);
            }
        }
        else {
            if (!clip) {
                return;
            }
            path = clip._nativeAsset;
        }
        var innerAudio = playInnerAudio(path, loop, volume);
        cc.audioEngine.audios.push(innerAudio);
        return innerAudio;
    };
    cc.audioEngine.playMusic = function (clip, loop) {
        cc.audioEngine.stop(_music.id);
        _music.id = cc.audioEngine.play(clip, loop, _music.volume);
        _music.loop = loop;
        _music.clip = clip;
        return _music.id;
    };
    cc.audioEngine.stopMusic = function () {

        if (_music.id !== -1) {
            _music.id.state = cc.AudioEngine.AudioState.STOPPED;
            _music.id.stop();
        }
    };
    cc.audioEngine.pauseMusic = function () {

        if (_music.id !== -1) {
            _music.id.state = cc.AudioEngine.AudioState.PAUSED;
            _music.id.pause();
        }
        return _music.id;
    };
    cc.audioEngine.resumeMusic = function () {

        if (_music.id !== -1) {
            _music.id.state = cc.AudioEngine.AudioState.PLAYING;
            _music.id.play();
        }
        return _music.id;
    };
    cc.audioEngine.getMusicVolume = function () {
        return _music.volume;
    };
    cc.audioEngine.setMusicVolume = function (volume) {
        _music.volume = volume;
        if (_music.id !== -1) {
            _music.id.volume = _music.volume;
        }
        return volume;
    };
    cc.audioEngine.isMusicPlaying = function () {
        return cc.audioEngine.getState(_music.id) === cc.AudioEngine.AudioState.PLAYING;
    };
    cc.audioEngine.playEffect = function (clip, loop) {
        const volume = _effect.volume;

        if (typeof clip === 'string') {
            return cc.audioEngine.play(path, loop, volume);
        }
        else {
            if (!clip) {
                return;
            }
            if (clip.loaded) {
                return cc.audioEngine.play(clip._nativeAsset, loop, volume);
            }
            else {
                cc.loader.load({
                    url: clip.nativeUrl,
                    skips: ['Loader']
                },
                    function (err, audioNativeAsset) {
                        if (err) {
                            cc.error(err);
                            return;
                        }
                        if (!clip.loaded) {
                            clip._nativeAsset = audioNativeAsset;
                            cc.audioEngine.play(audioNativeAsset, loop, volume);
                        }
                    });

                return -1;
            }
        }
    };
    cc.audioEngine.setEffectsVolume = function (volume) {
        for (const id in cc.audioEngine.audios) {
            if (id === _music.id) continue;
            cc.audioEngine.setVolume(id, volume);
        }

        _effect.volume = volume;
    };
    cc.audioEngine.getEffectsVolume = function () {
        return _effect.volume;
    };
    cc.audioEngine.pauseEffect = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            return id.pause();
        }
    };
    cc.audioEngine.pauseAllEffects = function () {
        var musicPlay = cc.audioEngine.getState(_music.id) === cc.AudioEngine.AudioState.PLAYING;
        cc.audioEngine.pauseAll();
        if (musicPlay) {
            _music.id.play();
        }
    };
    cc.audioEngine.resumeEffect = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            cc.audioEngine.resume(id);
        }
    };
    cc.audioEngine.resumeAllEffects = function () {
        var musicPaused = cc.audioEngine.getState(_music.id) === cc.AudioEngine.AudioState.PAUSED;
        cc.audioEngine.resumeAll();
        if (musicPaused && cc.audioEngine.getState(_music.id) === cc.AudioEngine.AudioState.PLAYING) {
            cc.audioEngine.pause(_music.id);
        }
    };
    cc.audioEngine.stopEffect = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            return id.stop();
        }
    };
    cc.audioEngine.stopAllEffects = function () {
        var musicPlaying = cc.audioEngine.getState(_music.id) === cc.AudioEngine.AudioState.PLAYING;
        var currentTime = cc.audioEngine.getCurrentTime(_music.id);
        cc.audioEngine.stopAll();
        if (musicPlaying) {
            _music.id = cc.audioEngine.play(_music.clip, _music.loop);
            _music.id.seek(currentTime);
        }
    };

    // Function Implement in C++
    cc.audioEngine.getMaxAudioInstance = function () {
        return 24;
    };
    cc.audioEngine.getState = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1 && id.currentTime <= id.duration) {
            return id.state;
        }
        return cc.AudioEngine.AudioState.ERROR
    }
    cc.audioEngine.pauseAll = function () {
        cc.audioEngine.audios.forEach(element => {
            cc.audioEngine.pause(element);
        });
    }
    cc.audioEngine.resumeAll = function () {
        cc.audioEngine.audios.forEach(element => {
            cc.audioEngine.resume(element);
        });
    }
    cc.audioEngine.stopAll = function () {
        cc.audioEngine.audios.forEach(element => {
            cc.audioEngine.stop(element);
        });
    }
    cc.audioEngine.stop = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);

        if (index > -1) {
            id.state = cc.AudioEngine.AudioState.STOPPED;
            id.stop();
            cc.audioEngine.audios = cc.audioEngine.audios.filter(function (item) { return item !== id });
        }
    };
    cc.audioEngine.pause = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            id.state = cc.AudioEngine.AudioState.PAUSED;
            id.pause();
        }
        return id;
    };
    cc.audioEngine.resume = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            id.state = cc.AudioEngine.AudioState.PLAYING;
            id.play();
        }
        return id;
    };

    // incompatible implementation for game pause & resume
    cc.audioEngine._break = function () { };
    cc.audioEngine._restore = function () { };

    // deprecated

    cc.audioEngine._uncache = cc.audioEngine.uncache;
    cc.audioEngine.uncache = function (clip) {
        // No used in vivo
    };

    cc.audioEngine._preload = cc.audioEngine.preload;
    cc.audioEngine.preload = function (filePath, callback) {
        cc.warn('`cc.audioEngine.preload` is deprecated, use `cc.loader.loadRes(url, cc.AudioClip)` instead please.');
    };

    cc.audioEngine.setFinishCallback = function (id, callback) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            id.onEnded(callback);
        }
    }

    cc.audioEngine.getCurrentTime = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            return id.currentTime;
        }
        return new Number(0);
    };

    cc.audioEngine.setCurrentTime = function (id, time) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            id.seek(time)
        }
    };

    cc.audioEngine.setLoop = function (id, loop) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            id.loop = loop;
        }
    };

    cc.audioEngine.isLoop = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            return id.loop;
        }
        return false;
    };

    cc.audioEngine.setVolume = function (id, volume) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            id.volume = volume;
        }
    };

    cc.audioEngine.getVolume = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            return id.volume;
        }
        return new Number(0);
    };

    cc.audioEngine.getDuration = function (id) {
        var index = cc.audioEngine.audios.indexOf(id);
        if (index > -1) {
            return new Number(id.duration);
        }
        return new Number(0);
    };

    cc.audioEngine.setMaxAudioInstance = function (num) { };

    cc.audioEngine.AudioState = cc.AudioEngine.AudioState;

    cc.audioEngine.getProfile = function (profileName) { };

})(cc.Audio.prototype);
