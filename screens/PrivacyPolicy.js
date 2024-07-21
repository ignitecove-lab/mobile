import { View, Text, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import tw from 'tailwind-rn';

const PrivacyPolicyScreen = () => {
  const privacyPolicy = `Privacy Policy

Effective Date: 21/06/2023\n
  
      1. Introduction
  
Ignite LTD ("Ignite," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access and use our application, Ignite, and any associated services (collectively referred to as the "Services"). By accessing or using our Services, you consent to the terms of this Privacy Policy.
  

      2. Information We Collect

We may collect various types of information from you when you use our Services. This information includes:
  
          2.1. Personal Information: 
          
          We may collect personal information that you 
          voluntarily provide to us, such as your name, email 
          address, social media profiles, date of birth, 
          phone/mobile number, home/mailing address, 
          work address, website address, payment 
          information, driver's license details, passport 
          number, tax/SSN/Medicare/etc. number, and 
          other similar information.

          2.2. Log Data: 
          
          When you access our Services, our servers 
          automatically log certain information provided
          by your device. This may include your device's 
          Internet Protocol (IP) address, device type and 
          version, activities within the application, date and 
          time of access, and other relevant details.

          2.3. Device Data: 
          
          Our application may also access and collect data
          from your device's built-in tools, such as your 
          identity, location data, camera, microphone, 
          accelerometer, body sensor, calendar, contacts, 
          phone/SMS, storage, photos and/or media, 
          notifications, voice assistance, background data 
          refresh, mobile data, device/app history, 
          flashlight, and Bluetooth. The specific data 
          collected depends on your device settings and 
          permissions.

          2.4. Business Data: 
          
          As part of our Services, we may collect and 
          process business data that accumulates during 
          your use of our platform. This may include 
          transaction records, stored files, user profiles, 
          analytics data, and other metrics generated as 
          you interact with our Services.
  

      3. Legal Basis for Processing

We process your personal information lawfully, fairly, and transparently based on legal grounds permitted by applicable data protection laws. We collect and process your information only when:
  
          3.1. It is necessary for the performance of a 
                 contract to which you are a party or to take 
                 steps at your request before entering into 
                 such a contract.

          3.2. We have a legitimate interest that is not 
                 overridden by your data protection interests, 
                 such as research and development, marketing 
                 our Services, protecting our legal rights and 
                 interests, and ensuring the security of our 
                 Services.

          3.3. You have given us your consent to process your
                 personal information for specific purposes, 
                 which you may withdraw at any time.

          3.4. We are legally obligated to process your data 
                 to comply with applicable laws and regulations.
  

      4. Use and Sharing of Information
          
We may use the information collected from you for various purposes, including but not limited to:
  
          4.1. Providing and improving our Services.\n
          4.2. Processing transactions and payments.\n
          4.3. Enabling access to and usage of our 
                 application and associated platforms.\n
          4.4. Communicating with you and responding 
                 to your inquiries.\n
          4.5. Conducting internal record keeping and 
                 administrative tasks.\n
          4.6. Analyzing data for research, market 
                 research, and business development.\n
          4.7. Running competitions and offering 
                 additional benefits.\n
          4.8. Sending you promotional information 
                 about our products, services, and 
                 third-party offerings that may interest you.\n
          4.9. Complying with legal obligations and 
                 resolving disputes.\n
          4.10. Considering employment applications.\n
  
We may share your information with various third parties, including service providers, employees, contractors, sponsors or promoters of competitions, credit reporting agencies, regulatory authorities, law enforcement agencies, and third parties who assist us in providing information, products, services, or direct marketing to you.
   

      5. International Transfers of Information
          
We may transfer and store your personal information outside of your country of residence, including to countries that may have different data protection laws. By providing us with your information, you consent to such transfers. We will ensure that any international transfers comply with applicable data protection laws. We will take appropriate safeguards to protect your information, such as using standard data protection clauses approved by relevant authorities or employing other legally accepted means.


      6. Your Rights and Choices
          
You have certain rights and choices regarding your personal information. These include:

          6.1. Choice and Consent: 
                 By providing your personal information, 
                 you consent to our collection, use, and 
                 disclosure of your information as outlined
                 in this Privacy Policy.\n
          6.2. Restriction of Processing: 
                 You may choose to restrict or limit the 
                 collection or use of your personal info. 
                 If you have previously agreed to receive
                 direct marketing communications, you may 
                 change your preferences at any time.\n
          6.3. Access and Data Portability: 
                 You have the right to access and request a 
                 copy of the personal information we hold 
                 about you. You may also request the erasure 
                 of your personal information or the transfer 
                 of your information to another party.\n
          6.4. Correction: 
                 If you believe that any information we hold 
                 about you is inaccurate, incomplete, or 
                 outdated, you may request its correction.\n
          6.5. Notification of Data Breaches: 
                 We will comply with applicable laws and 
                 notify you in the event of a data breach 
                 involving your personal information.\n
          6.6. Complaints: 
                 If you believe we have violated applicable 
                 data protection laws, you have the right to 
                 lodge a complaint with us or with a 
                 regulatory body or data protection authority.\n
          6.7. Unsubscribe: 
                 You may unsubscribe from our email database 
                 or opt-out of receiving communications, 
                 including marketing communications, at any 
                 time.\n

      7. Cookies
          
Our Services may use cookies to enhance your experience. Cookies are small data files that are placed on your device. We use cookies for various purposes, such as providing core features of our application, tracking usage and performance, personalizing your experience, and serving targeted advertisements. By using our Services, you consent to the use of cookies.\n

      8. Business Transfers
          
In the event of a merger, acquisition, or bankruptcy involving Ignite LTD, your information may be transferred as part of the business assets. Any acquiring party will be required to adhere to this Privacy Policy.\n

      9. External Links
          
Our Services may contain links to external websites that are not operated by us. We do not control the content and policies of these third-party sites and are not responsible for their privacy practices. We recommend reviewing the privacy policies of any external sites you visit.\n

      10. Changes to this Privacy Policy
          
We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy within our Services or through other communication channels. Your continued use of our Services after such modifications constitutes your acceptance of the updated Privacy Policy.
          

      Contact Us

      If you have any questions, concerns, or requests 
      regarding this Privacy Policy or the privacy 
      practices of Ignite LTD, please contact us at

      igniteint69@gmail.com.
  
  `;

  return (
    <View style={tw("flex-1")}>
      <ScrollView>
        <Text>{privacyPolicy}</Text>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicyScreen
