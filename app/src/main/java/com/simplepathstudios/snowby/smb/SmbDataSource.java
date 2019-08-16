package com.simplepathstudios.snowby.smb;

import android.net.Uri;
import android.util.Log;

import androidx.annotation.Nullable;

import com.google.android.exoplayer2.upstream.BaseDataSource;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.upstream.TransferListener;

import java.io.IOException;
import java.util.Arrays;

import jcifs.smb.SmbFile;

public class SmbDataSource extends BaseDataSource {
    private final String TAG = "SmbDataSource";
    private String path;
    private SmbStream stream;
    private Uri uri;

    public SmbDataSource(String smbPath){
        super(false);
        Log.d(TAG,"Creating data source for "+smbPath);
        path = smbPath;
        uri = Uri.parse(smbPath);
    }

    @Override
    public long open(DataSpec dataSpec) throws IOException {
        Log.d(TAG,"Opening data source " + path);
        stream = new SmbStream(new SmbFile(path));
        Log.d(TAG,"Seeking to "+dataSpec.absoluteStreamPosition);
        stream.seek(dataSpec.absoluteStreamPosition);
        Log.d(TAG,"Stream length is "+stream.length());
        return stream.available();
    }

    @Override
    public int read(byte[] buffer, int offset, int readLength) throws IOException {
        return stream.read(buffer,offset,readLength);
    }

    @Nullable
    @Override
    public Uri getUri() {
        Log.d(TAG,"Getting uri " + uri);
        return uri;
    }

    @Override
    public void close() throws IOException {
        Log.d(TAG,"Closing data source " + path);
        stream.close();
    }
}
