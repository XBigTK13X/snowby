package com.simplepathstudios.snowby;

import android.util.Log;

import java.io.IOException;
import java.io.InputStream;

import jcifs.smb.SmbException;
import jcifs.smb.SmbFile;

public class SmbStream extends RandomAccessInputStream{
    private static final String TAG = "SmbStream";
    private SmbFile file;
    private InputStream stream;

    public SmbStream(SmbFile smbFile){
        file = smbFile;
        try {
            stream = smbFile.getInputStream();
        } catch (IOException e) {
            Log.e(TAG,"Unable to open input stream", e);
        }
    }

    @Override
    long length(){
        try {
            return file.length();
        } catch (SmbException e) {
            Log.e(TAG,"Unable to read file length", e);
            return -1;
        }
    }

    @Override
    void seek(long offset) throws IOException {
        stream = file.getInputStream();
        stream.skip(offset);
    }

    @Override
    public int read() throws IOException{
        return stream.read();
    }
}
