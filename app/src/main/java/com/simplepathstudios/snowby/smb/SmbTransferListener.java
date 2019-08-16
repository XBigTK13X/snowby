package com.simplepathstudios.snowby.smb;

import android.util.Log;

import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.TransferListener;

public class SmbTransferListener implements TransferListener {
    private static final String TAG = "SmbTransferListener";
    @Override
    public void onTransferInitializing(DataSource source, DataSpec dataSpec, boolean isNetwork) {
        Log.d(TAG,"Initializing transfer " + dataSpec);
    }

    @Override
    public void onTransferStart(DataSource source, DataSpec dataSpec, boolean isNetwork) {
        Log.d(TAG,"Starting transfer " + dataSpec);
    }

    @Override
    public void onBytesTransferred(DataSource source, DataSpec dataSpec, boolean isNetwork, int bytesTransferred) {
        Log.d(TAG,"Transferring bytes " + dataSpec);
    }

    @Override
    public void onTransferEnd(DataSource source, DataSpec dataSpec, boolean isNetwork) {
        Log.d(TAG,"Bytes transferred " + dataSpec);
    }
}
