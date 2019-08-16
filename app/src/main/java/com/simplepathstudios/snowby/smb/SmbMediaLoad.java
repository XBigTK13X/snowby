package com.simplepathstudios.snowby.smb;

import android.net.Uri;
import android.os.AsyncTask;

import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.upstream.DataSource;

public class SmbMediaLoad extends AsyncTask<String, Void, MediaSource> {
        @Override
        protected MediaSource doInBackground(String... smbPaths) {
            final String videoPath = smbPaths[0];
            final Uri videoUri = Uri.parse(videoPath);
            //https://github.com/google/ExoPlayer/issues/5883
            DataSource.Factory dataSourceFactory = new SmbDataSourceFactory(videoPath);
            return new ProgressiveMediaSource.Factory(dataSourceFactory).createMediaSource(videoUri);
        }
}
