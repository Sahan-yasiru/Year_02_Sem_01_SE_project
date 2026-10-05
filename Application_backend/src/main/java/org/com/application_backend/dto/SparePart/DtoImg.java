package org.com.application_backend.dto.SparePart;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class DtoImg {
    private Long id;
    private String imgName;
    private String imgType;
    private byte[] imgData;


}
