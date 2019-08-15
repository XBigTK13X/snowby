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

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaFormat;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.SurfaceView;

import androidx.leanback.app.VideoSupportFragment;
import androidx.leanback.app.VideoSupportFragmentGlueHost;
import androidx.leanback.media.MediaPlayerAdapter;
import androidx.leanback.media.PlaybackTransportControlGlue;
import androidx.leanback.widget.PlaybackControlsRow;

import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.source.ExtractorMediaSource;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.upstream.FileDataSource;
import com.google.android.exoplayer2.util.Util;
import com.simplepathstudios.snowby.MediaStream;
import com.simplepathstudios.snowby.SambaHttpStream;
import com.simplepathstudios.snowby.SmbStream;
import com.simplepathstudios.snowby.activity.MediaLibraryActivity;
import com.simplepathstudios.snowby.activity.PlaybackVideoActivity;
import com.simplepathstudios.snowby.emby.EmbyApiClient;
import com.simplepathstudios.snowby.emby.Item;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.ByteBuffer;
import java.util.concurrent.ExecutionException;

import jcifs.smb.SmbFile;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import static android.content.Context.AUDIO_SERVICE;

/**
 * Handles video playback with media controls.
 */
public class PlaybackVideoFragment extends VideoSupportFragment {

    private final String TAG = "PlaybackVideoFragment";

    private PlaybackTransportControlGlue<MediaPlayerAdapter> mediaTransportControlGlue;

    private SimpleExoPlayer player;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final String itemId =
                (String) getActivity().getIntent().getSerializableExtra(PlaybackVideoActivity.PLAYBACK_TARGET);

        //player = ExoPlayerFactory.newSimpleInstance(getContext());
        final SurfaceView surfaceView = new SurfaceView(getContext());
        final EmbyApiClient emby = EmbyApiClient.getInstance(getContext());
        emby.api.getItem(emby.authHeader,emby.userId, itemId).enqueue(new Callback<Item>() {
            @Override
            public void onResponse(Call<Item> call, Response<Item> response) {
                Log.i(TAG,"Loaded information for media");
                final Item item = response.body();

                MediaCodec mc = null;
                try {
                    MediaStream mediaStream = new LoadVideo().execute(item.Path).get();
                    mc.configure(mf, surfaceView.getHolder().getSurface(), null, 0);
                    mc.start();
                    for (;;) {
                        int ibi = mc.dequeueInputBuffer(1000);
                        if (ibi >= 0) {
                            ByteBuffer ib = mc.getInputBuffer(ibi);
                            try {
                                // fill input buffer (ib) with valid data
                                ib.put((byte)smbStream.read());
                                mc.queueInputBuffer(ibi,0,0,0,0);

                            } catch (IOException e) {
                                Log.e(TAG,"Unable to read smb stream",e);
                            }

                        } else{
                            break;
                        }
                        // no need to dequeue explicitly output buff
                    }
                    mc.stop();
                    mc.release();
                    mc = null;
                } catch (ExecutionException e) {
                    Log.e(TAG,"Unable to execute background thread",e);
                } catch (InterruptedException e) {
                    Log.e(TAG,"Background thread interrupeted",e);
                }

                /*try {
                    MediaSource videoSource = new LoadVideo().execute(item.Path).get();
                    player.prepare(videoSource);
                } catch (ExecutionException e) {
                    Log.e(TAG,"The media prep thread encountered an execution error",e);
                } catch (InterruptedException e) {
                    Log.e(TAG,"The media prep thread was interrupted",e);
                }*/
            }

            @Override
            public void onFailure(Call<Item> call, Throwable t) {
                Log.e(TAG,"An error occurred while media",t);
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mediaTransportControlGlue != null) {
            mediaTransportControlGlue.pause();
        }
    }

    private class LoadVideo extends AsyncTask<String, Void, MediaStream> {
        @Override
        protected MediaStream doInBackground(String... smbPaths) {
            final String videoPath = smbPaths[0];
            SmbStream smbStream = null;
            try {
                smbStream = new SmbStream(new SmbFile(videoPath));
            } catch (MalformedURLException e) {
                Log.e(TAG,"Unable to create smb stream",e);
            }
            AudioManager am = (AudioManager)getContext().getSystemService(AUDIO_SERVICE);
            int audioSessionId = am.generateAudioSessionId();
            AudioAttributes.Builder aab = new AudioAttributes.Builder();
            aab.setUsage(AudioAttributes.USAGE_MEDIA);
            aab.setContentType(AudioAttributes.CONTENT_TYPE_MOVIE);
            aab.setFlags(AudioAttributes.FLAG_HW_AV_SYNC);
            AudioAttributes aa = aab.build();
            AudioTrack at = new AudioTrack(aa, null,1024,0,audioSessionId);
            // retrieve codec with tunneled video playback feature
            MediaFormat mf = MediaFormat.createVideoFormat("video/hevc", 3840, 2160);
            mf.setFeatureEnabled(MediaCodecInfo.CodecCapabilities.FEATURE_TunneledPlayback, true);
            MediaCodecList mcl = new MediaCodecList(MediaCodecList.ALL_CODECS);
            String codecName = mcl.findDecoderForFormat(mf);
            if (codecName == null) {
                Log.e(TAG,"No suitable codec found",new Exception("Unable to resolve codec for " + item.Path));
            }
            // create codec and configure it
            mf.setInteger(MediaFormat.KEY_AUDIO_SESSION_ID, audioSessionId);
            MediaCodec mc = null;
            try {
                mc = MediaCodec.createByCodecName(codecName);
            } catch (IOException e) {
                Log.e(TAG,"Unable to create codec by name: "+codecName,e);
            }

            MediaStream mediaStream = new MediaStream();
            mediaStream.MediaCodec = mc;
            mediaStream.SmbStream = smbStream;

            return mediaStream;

            /*try {
                SmbFile networkFile = new SmbFile(videoPath);
                SambaHttpStream httpStream = new SambaHttpStream(networkFile);
                Uri videoUri = httpStream.getUri();
                Log.d(TAG,"Streaming Uri obtained: "+videoUri);
                DataSource.Factory dataSourceFactory = new DefaultDataSourceFactory(getContext(), Util.getUserAgent(getContext(),"snowby"));
                MediaSource videoSource = new ProgressiveMediaSource.Factory(dataSourceFactory).createMediaSource(videoUri);
                return videoSource;
                //FileDataSource fileSource = new FileDataSource();
                //fileSource.open()
                //return ExtractorMediaSource.Factory(new DefaultDataSourceFactory(getContext(), "ua").createMediaSource(videoPath);

            } catch (MalformedURLException e) {
                Log.e(TAG,"Malformed URL provided for media: "+videoPath,e);
            } catch (IOException e) {
                Log.e(TAG,"IOException occurred while accessing media: "+videoPath,e);
            }
            return null;*/
        }
    }
}