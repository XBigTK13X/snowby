// Modified from https://github.com/hierynomus/smbj/issues/89#issuecomment-311452732
/*
package com.simplepathstudios.snowby.smb;

import com.hierynomus.smbj.SMBClient;
import com.hierynomus.smbj.SmbConfig;
import com.hierynomus.smbj.auth.AuthenticationContext;
import com.hierynomus.smbj.connection.Connection;
import com.hierynomus.smbj.session.Session;
import com.hierynomus.smbj.share.DiskShare;
import com.hierynomus.smbj.share.Share;

import java.io.IOException;
import java.net.URI;
import java.util.concurrent.TimeUnit;

import static com.hierynomus.smbj.SMBClient.DEFAULT_PORT;

public class SmbClient {
    public static Share connect(URI uri) throws IOException {
        if (!uri.getScheme().equals("smb")) {
            throw new IOException("Unsupported URI scheme: " + uri.getScheme());
        }

        String host = uri.getHost();
        int port = uri.getPort();
        if (port == -1) {
            port = DEFAULT_PORT;
        }

        AuthenticationContext authContext;
        String userInfo = uri.getUserInfo();
        if (userInfo == null) {
            authContext = AuthenticationContext.anonymous();
        } else {
            String[] userAndPass = userInfo.split(":", 2);
            String user = userAndPass[0];
            String[] userAndDomain = user.split(";", 2);
            String domain, username;
            if (userAndDomain.length == 1) {
                username = userAndDomain[0];
                domain = "";
            } else {
                username = userAndDomain[1];
                domain = userAndDomain[0];
            }
            char[] pass = (userAndPass.length > 1 ? userAndPass[1] : "").toCharArray();
            authContext = new AuthenticationContext(username, pass, domain);
        }

        String path = uri.getPath();
        if (path == null) {
            throw new IOException("Path must be specified");
        }
        String[] pathComponents = path.split("/", 3);
        if (pathComponents.length != 2) {
            throw new IOException("Only one path component may be specified");
        }
        String shareName = pathComponents[1];

        SmbConfig config = SmbConfig.builder()
                .withTimeout(120, TimeUnit.SECONDS) // Timeout sets Read, Write, and Transact timeouts (default is 60 seconds)
                .withSoTimeout(180, TimeUnit.SECONDS) // Socket Timeout (default is 0 seconds, blocks forever)
                .build();

        SMBClient client = new SMBClient(config);

        try (Connection connection = client.connect(host)) {
            AuthenticationContext ac = AuthenticationContext.anonymous();
            Session session = connection.authenticate(ac);

            // Connect to Share
            try (DiskShare share = (DiskShare) session.connectShare(shareName)) {
                DiskShare s2 = share;
                return share;
            }
        }
    }
}
*/