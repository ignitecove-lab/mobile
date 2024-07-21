import { View, Text, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import tw from 'tailwind-rn';


const TermsScreen = () => {
  const termsContent = `Ignite Terms of Service\n

  1. Agreement\n
By accessing our platform, Ignite, you agree to comply with these terms of service, as well as all applicable laws and regulations. You acknowledge that you are responsible for complying with local laws in your jurisdiction. If you do not agree to any of these terms, you are not permitted to use or access Ignite. The materials available on Ignite are protected by copyright and trademark laws.\n

  2. License to Use\n
You are granted a temporary, non-transferable license to download one copy of Ignite per device for personal, non-commercial use only. This license does not transfer ownership, and under no circumstances may you: \n
          a. Modify or duplicate the materials;\n 
          b. Use the materials for any commercial purpose 
             or public display, whether commercial or 
             non-commercial; \n
          c. Attempt to decompile or reverse engineer any
             software contained in Ignite; \n
          d. Remove any copyright or proprietary notations 
             from the materials;\n \n\t\t\t\t\t\tor\n 
          e. Transfer the materials to another person or 
             "mirror" them on any other server. This license
             will automatically terminate if you violate any 
             of these restrictions and may be terminated by 
             Ignite at any time. Upon termination, you must 
             destroy any downloaded materials in your 
             possession, whether in electronic or printed 
             format.\n

  3. Disclaimer

The materials provided on Ignite are on an "as is" basis. Ignite makes no warranties, expressed or implied, and hereby disclaims all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Furthermore, Ignite does not warrant or make any representations regarding the accuracy, likely results, or reliability of the use of the materials on its platform or in relation to any materials on linked websites.\n

  4. Limitations of Liability
  
In no event shall Ignite or its suppliers be liable for any damages arising from the use or inability to use Ignite, including but not limited to, damages for loss of data, profit, or business interruption, even if Ignite or its authorized representative has been notified orally or in writing of the possibility of such damages. These limitations may not apply to you if your jurisdiction does not allow limitations on implied warranties or limitations of liability for consequential or incidental damages.\n

  5. Accuracy of Information 
  
The materials appearing on Ignite may contain technical, typographical, or photographic errors. Ignite does not warrant that any of the materials on its platform are accurate, complete, or current. Ignite may make changes to the materials at any time without notice. However, Ignite does not commit to updating the materials.

  6. External Links 

Ignite has not reviewed all of the websites linked to its platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Ignite of the site. Your use of any linked website is at your own risk.

  7. Modifications 
  
Ignite may revise these terms of service for its platform at any time without notice. By using Ignite, you agree to be bound by the most recent version of these terms of service.

  8. Governing Law 

These terms and conditions are governed by and interpreted in accordance with the laws applicable in each respective country. You agree to submit to the exclusive jurisdiction of the courts in your jurisdiction for any disputes arising from or related to these terms and conditions.
`;
  return (
    <View style={tw("flex-1")}>
      <ScrollView>
        <Text>{termsContent}</Text>
      </ScrollView>
    </View>
  );
};

export default TermsScreen