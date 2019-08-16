package com.simplepathstudios.snowby.smb;

import com.google.android.exoplayer2.upstream.DataSource;

public class SmbDataSourceFactory implements DataSource.Factory {
    private String path;
    public SmbDataSourceFactory(String smbPath){
        path = smbPath;
    }
    @Override
    public DataSource createDataSource() {
        SmbDataSource dataSource = new SmbDataSource(path);
        //dataSource.addTransferListener(new SmbTransferListener());
        return dataSource;
    }
}
