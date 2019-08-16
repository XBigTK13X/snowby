package com.simplepathstudios.snowby.smb;

import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;

import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
import com.google.android.exoplayer2.source.ExtractorMediaSource;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;

import java.io.IOException;

public class SmbMediaLoad extends AsyncTask<String, Void, MediaSource> {
    private static final String TAG = "SmbMediaLoad";
        @Override
        protected MediaSource doInBackground(String... smbPaths) {
            final String videoPath = smbPaths[0];
            final Uri videoUri = Uri.parse(smbPaths[0]);
            //https://github.com/google/ExoPlayer/issues/5883
            SmbDataSource dataSource = new SmbDataSource(videoPath);
            try {
                dataSource.open(new DataSpec(videoUri));
            } catch (IOException e) {
                Log.e(TAG,"An error occurred while opening the stream",e);
            }
            DataSource.Factory factory = new DataSource.Factory() {

                @Override
                public DataSource createDataSource() {
                    return dataSource;
                }
            };
            return new ExtractorMediaSource(dataSource.getUri(),factory,new DefaultExtractorsFactory(),null,null);
        }
}
