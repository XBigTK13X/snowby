/*
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

package com.simplepathstudios.snowby.fragment;

import android.os.Bundle;
import android.util.Log;

import androidx.leanback.app.VideoSupportFragment;
import androidx.leanback.media.MediaPlayerAdapter;
import androidx.leanback.media.PlaybackTransportControlGlue;

import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.source.MediaSource;
import com.simplepathstudios.snowby.activity.PlaybackVideoActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.Item;
import com.simplepathstudios.snowby.smb.SmbMediaLoad;

import java.util.concurrent.ExecutionException;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Handles video playback with media controls.
 */
public class PlaybackVideoFragment extends VideoSupportFragment {

    private final String TAG = "PlaybackVideoFragment";


    private SimpleExoPlayer player;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final String itemId =
                (String) getActivity().getIntent().getSerializableExtra(PlaybackVideoActivity.PLAYBACK_TARGET);

        player = ExoPlayerFactory.newSimpleInstance(getContext());
        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.getItem(emby.authHeader,emby.userId, itemId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                Log.i(TAG,"Loaded information for media");
                final Item item = response.body();
                try {
                    MediaSource mediaSource = new SmbMediaLoad().execute(item.Path).get();
                    player.setPlayWhenReady(true);
                    player.addListener(new Player.EventListener(){
                        @Override
                        public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
                            if(playbackState == Player.STATE_BUFFERING){
                                Log.d(TAG,"The exoplayer changed states to BUFFERING - "+playWhenReady);
                            }
                            else if(playbackState == Player.STATE_ENDED){
                                Log.d(TAG,"The exoplayer changed states to ENDED");
                            }
                            else if(playbackState == Player.STATE_IDLE){
                                Log.d(TAG,"The exoplayer changed states to IDLE");
                            }
                            else if(playbackState == Player.STATE_READY){
                                Log.d(TAG,"The exoplayer changed states to STATE_READY");
                            }
                            else{
                                Log.d(TAG,"The exoplayer changed to an unknown state"+playbackState);
                            }
                        }
                        public void onPlayerError(ExoPlaybackException error) {
                            Log.e(TAG,"An exoplayer error occurred",error);
                        }
                    });
                    player.prepare(mediaSource);
                } catch (ExecutionException e) {
                    Log.e(TAG,"The media prep thread encountered an execution error",e);
                } catch (InterruptedException e) {
                    Log.e(TAG,"The media prep thread was interrupted",e);
                }
            }

            @Override
            public void onFailure(Call<Item> call, Throwable t) {
                Log.e(TAG,"An error occurred while media was loading",t);
            }
        });
    }
}