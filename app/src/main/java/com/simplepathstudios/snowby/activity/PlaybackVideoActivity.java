/*
 * Copyright (C) 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.simplepathstudios.snowby.activity;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.ui.PlayerView;
import com.simplepathstudios.snowby.R;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.model.Item;
import com.simplepathstudios.snowby.smb.SmbMediaLoad;

import java.util.concurrent.ExecutionException;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public final class PlaybackVideoActivity extends Activity {
    private static final String TAG = "PlaybackVideoActivity";

    public static final String PLAYBACK_TARGET = "PLAYBACK_TARGET_ID";
    public static final String SHARED_ELEMENT_NAME = "playback_video";

    private PlayerView playerView;
    private PlayerManager player;

    private Context activityContext;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        activityContext = this;
        setContentView(R.layout.activity_playback_video);
        playerView = findViewById(R.id.player_view);

        final String itemId =
                (String) getIntent().getSerializableExtra(PlaybackVideoActivity.PLAYBACK_TARGET);
        final EmbyApiClient emby = EmbyApiClient.getInstance(this);
        emby.api.getItem(emby.authHeader,emby.userId, itemId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                Log.i(TAG, "Loaded information for media");
                final Item item = response.body();
                try {
                    MediaSource mediaSource = new SmbMediaLoad().execute(item.Path).get();
                    player = new PlayerManager(mediaSource);
                    player.init(activityContext,playerView);
                }
                catch (ExecutionException e) {
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

    @Override
    public void onResume() {
        super.onResume();
        //TODO reenable player.init(this, playerView);
    }

    @Override
    public void onPause() {
        super.onPause();
        player.reset();
    }

    @Override
    public void onDestroy() {
        player.release();
        super.onDestroy();
    }

}
