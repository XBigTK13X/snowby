package com.simplepathstudios.snowby.smb;

import android.util.Log;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

import jcifs.smb.SmbException;
import jcifs.smb.SmbFile;

public class SmbStream {
    private static final String TAG = "SmbStream";
    private static final int BUFFER_BYTE_COUNT = 8192 * 1000;
    private SmbFile file;
    private InputStream stream;
    private BufferedInputStream bufferedStream;
    private long readBytes=0;

    public SmbStream(SmbFile smbFile){
        file = smbFile;
        try {
            if(!smbFile.canRead()){
                throw new SmbException("Unable to read file "+smbFile.getPath());
            }
        } catch (SmbException e) {
            Log.e(TAG,"Unable to read smb file " + file.getPath(), e);
        }
        createBufferedInputStream();
    }

    public long skip(long offset) throws IOException {
        Log.d(TAG,"Seeking to "+offset);
        createBufferedInputStream();
        return bufferedStream.skip(offset);
    }

    public int read(byte[] b, int off, int len) throws IOException {
        readBytes += len;
        if(false && readBytes % 5000 == 0){
            Log.d(TAG, "Reading "+len+" bytes at offset "+off);
            Log.d(TAG, "Read a total of "+readBytes+" bytes with available "+bufferedStream.available());
            String latestBytes = Arrays.toString(b);
            Log.d(TAG, "Latest buffer with length "+b.length + " - " + latestBytes);
        }
        return bufferedStream.read(b, off, len);
    }

    private void createBufferedInputStream(){
        try {
            stream = file.getInputStream();
            bufferedStream = new BufferedInputStream(stream,BUFFER_BYTE_COUNT);
        } catch (IOException e) {
            Log.e(TAG,"Unable to open input stream", e);
        }
    }

    public void close() throws IOException {
        Log.d(TAG,"Read a total of "+readBytes+" bytes");
        bufferedStream.close();
        stream.close();
        file.close();
    }

    public long available(){
        try {
            long remaining = bufferedStream.available();
            if(remaining == 0){
                return file.length() - readBytes;
            }
        } catch (IOException e) {
            Log.e(TAG,"Unable to read stream length",e);
        }
        return 0;
    }
}
