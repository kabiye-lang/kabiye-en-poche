import { ScrollView } from 'react-native'

import Markdown from '@jonasmerlin/react-native-markdown-display'

import { MARKDOWN_STYLE } from '@/utils/design-system-nativewind'

import { View } from '../components/ui'

const content = `
**Conditions Générales d'Utilisation de l'Application "Kabiyè en Poche"**

*Dernière mise à jour : 2023*

Bienvenue sur "Kabiyè en Poche", une application d'apprentissage de la langue kabiyè développée par une communauté passionnée, en collaboration avec des technologies open source. L'utilisation de cette application est soumise aux conditions énoncées ci-dessous. En installant et en utilisant cette application, vous acceptez pleinement et sans réserve les présentes conditions.

**1. Utilisation de l'Application**

1.1. "Kabiyè en Poche" est une application destinée à l'apprentissage de la langue kabiyè de manière ludique et éducative.

1.2. L'application est le résultat du travail collaboratif d'une communauté engagée et utilise des technologies open source pour son développement.

1.3. L'utilisation de l'application est réservée à des fins personnelles et non commerciales.

**2. Contenu de l'Application**

2.1. Tout le contenu de l'application, y compris mais sans s'y limiter, les textes, les images et les sons, est la propriété de "Kabiyè en Poche" et de la communauté de contributeurs, et est protégé par les lois sur la propriété intellectuelle.

2.2. Vous acceptez de ne pas reproduire, distribuer ou créer des œuvres dérivées à partir du contenu de l'application sans l'autorisation préalable écrite de "Kabiyè en Poche".

**3. Absence de Compte Utilisateur**

3.1. L'application "Kabiyè en Poche" ne nécessite pas la création d'un compte utilisateur. Aucune information personnelle n'est collectée ni stockée.

3.2. "Kabiyè en Poche" ne sera pas responsable de la perte de données ou de l'accès non autorisé à votre appareil.

**4. Mode de Développement Open Source**

4.1. "Kabiyè en Poche" est développée en open source, ce qui signifie que le code source de l'application est accessible au public. Vous pouvez consulter, contribuer ou distribuer le code conformément aux licences open source associées.

4.2. La communauté encourage la participation et l'amélioration continue de l'application par le biais de contributions, de signalements de bogues et de suggestions.

**5. Modifications des Conditions**

5.1. "Kabiyè en Poche" se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des modifications par le biais d'une notification dans l'application.

5.2. En continuant à utiliser l'application après la publication des modifications, vous acceptez les conditions modifiées.

**6. Limitation de Responsabilité**

6.1. L'utilisation de l'application se fait à vos propres risques. "Kabiyè en Poche" ne garantit pas l'exactitude, la pertinence ou l'exhaustivité du contenu de l'application.

6.2. "Kabiyè en Poche" ne sera pas responsable des dommages directs, indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'incapacité d'utiliser l'application.

Merci d'utiliser "Kabiyè en Poche" pour votre apprentissage linguistique !`

export default function TermsAndConditionsScreen() {
  return (
    <View flex padding-10>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Markdown style={MARKDOWN_STYLE}>{content}</Markdown>
      </ScrollView>
    </View>
  )
}
