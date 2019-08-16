package com.simplepathstudios.snowby.smb;

import android.util.Log;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

import jcifs.smb.SmbException;
import jcifs.smb.SmbFile;

public class SmbStream extends InputStream {
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

    public long length(){
        try {
            Log.d(TAG, "File length is "+file.length()+" bytes");
            return file.length();
        } catch (SmbException e) {
            Log.e(TAG,"Unable to read file length", e);
            return -1;
        }
    }

    public void seek(long offset) throws IOException {
        Log.d(TAG,"Seeking to "+offset);
        createBufferedInputStream();
        bufferedStream.skip(offset);
    }

    public int read(byte[] b, int off, int len) throws IOException {
        //Log.d(TAG,"Reading "+len+" bytes at offset "+off);
        readBytes += len;
        if(readBytes % 1000000 == 0){
            //Log.d(TAG,"Read a total of "+readBytes+" bytes");
            //Log.d(TAG, "Latest buffer " + Arrays.toString(b));
        }
        return bufferedStream.read(b, off, len);
    }

    @Override
    public int read() throws IOException{
        return bufferedStream.read();
    }

    private void createBufferedInputStream(){
        try {
            stream = file.getInputStream();
            bufferedStream = new BufferedInputStream(stream,BUFFER_BYTE_COUNT);
        } catch (IOException e) {
            Log.e(TAG,"Unable to open input stream", e);
        }
    }

    @Override
    public void close() throws IOException {
        bufferedStream.close();
        stream.close();
        file.close();
    }
}
